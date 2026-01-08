"""
Reusable recommendation engine module.
Contains core logic for generating group recommendations using the DQN model.
"""
import os
import numpy as np
import torch
from datetime import datetime

from dataset_state_mapper import embed_hobbies
from reco_env import SequentialRecEnv
from dqn_agent import QNetwork


class RecommendationEngine:
    """
    Loads the DQN model and generates personalized group recommendations.
    """
    
    def __init__(self, model_path="dqn_recommender.pth"):
        """Initialize the recommendation engine with a trained model."""
        self.model_path = model_path
        self.model = None
        self.device = torch.device("cpu")
        # Fixed env config used during training/inference
        self.env = SequentialRecEnv(
            num_groups=50,
            embed_dim=8,
            seq_len=5,
            max_steps=20,
        )
        self._load_model()
    
    def _load_model(self):
        """Load the trained DQN model from disk."""
        print(f"[{datetime.now().isoformat()}] Loading DQN model from {self.model_path}...")
        
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found: {self.model_path}")
        
        # Determine input/output dims based on env used for training
        input_dim = self.env.embed_dim * 2
        action_dim = self.env.num_groups
        # Initialize QNetwork and load weights
        self.model = QNetwork(input_dim, action_dim).to(self.device)
        checkpoint = torch.load(self.model_path, map_location=self.device)
        self.model.load_state_dict(checkpoint)
        self.model.eval()
        print(f"[{datetime.now().isoformat()}] Model loaded successfully (input_dim={input_dim}, action_dim={action_dim})")
    
    def generate_recommendations(self, user_data, groups_data, memberships_data, top_k=8):
        """
        Generate recommendations for all users.
        
        Args:
            user_data: List of user dicts with {id, auth_user_id}
            groups_data: List of group dicts with {id, name, type}
            memberships_data: List of membership dicts with {user_id, group_id}
            top_k: Number of recommendations per user
            
        Returns:
            List of recommendation dicts ready for insertion into recommendations_metadata
        """
        print(f"[{datetime.now().isoformat()}] Starting recommendation generation...")
        print(f"  Users: {len(user_data)}, Groups: {len(groups_data)}, Memberships: {len(memberships_data)}")
        
        # Build user interests mapping
        user_interests_map = self._fetch_user_interests()
        
        # Build membership lookup
        membership_set = {(m["user_id"], m["group_id"]) for m in memberships_data}
        
        all_recommendations = []
        
        for i, user in enumerate(user_data, 1):
            user_id = user["id"]
            user_hobbies = user_interests_map.get(user_id, [])
            user_groups = [m["group_id"] for m in memberships_data if m["user_id"] == user_id]
            
            # Build user state vector
            state_tensor = self._build_user_state(user_hobbies, user_groups)
            # Get Q-values for all groups
            with torch.no_grad():
                q_values = self.model(state_tensor).squeeze(0).cpu().numpy()
            
            # Mask already-joined groups
            for group_id in user_groups:
                idx = int(group_id) - 1  # DB ids are 1-based; model indices 0-based
                if 0 <= idx < len(q_values):
                    q_values[idx] = -1e9
            
            # Get top-k recommendations
            top_indices = np.argsort(q_values)[::-1][:top_k]
            
            for rank, group_idx in enumerate(top_indices, 1):
                if q_values[group_idx] == -np.inf:
                    continue
                
                # Map model index to actual group id (assumes contiguous ids starting at 1)
                mapped_group_id = group_idx + 1
                score = float(q_values[group_idx])
                
                all_recommendations.append({
                    "user_id": user_id,
                    "entity_type": "group",
                    "entity_id": mapped_group_id,
                    "score": score,
                    "rank": rank,
                    "metadata": {
                        "model": "dqn",
                        "version": "1.0",
                        "generated_at": datetime.now().isoformat()
                    }
                })
            
            if i % 10 == 0:
                print(f"[{datetime.now().isoformat()}] Processed {i}/{len(user_data)} users...")
        
        print(f"[{datetime.now().isoformat()}] Generated {len(all_recommendations)} recommendations")
        return all_recommendations

    def _build_user_state(self, hobbies_list, joined_groups_list):
        """Build state vector combining user interest embedding and last interactions embedding."""
        embed_dim = self.env.embed_dim
        seq_len = self.env.seq_len
        # User embedding from hobbies
        if not hobbies_list:
            hobbies_list = ["general"]
        user_embed = embed_hobbies(hobbies_list, embed_dim)
        # Last interactions sequence (use joined groups as proxy)
        last_seq = (joined_groups_list or [])[-seq_len:]
        if len(last_seq) < seq_len:
            last_seq = [0] * (seq_len - len(last_seq)) + last_seq
        last_seq = np.array(last_seq, dtype=int)
        last_seq = np.clip(last_seq, 0, self.env.num_groups - 1)
        # Convert sequence to embedding via env's item embeddings
        last_emb = self.env.group_embeddings[last_seq].mean(axis=0)
        # Final state: concat user_embed and last_emb
        state = np.concatenate([user_embed, last_emb]).astype(np.float32)
        return torch.tensor(state).unsqueeze(0).to(self.device)
    
    def _fetch_user_interests(self):
        """Fetch user interests from Supabase and map to user IDs."""
        from supabase import create_client
        
        supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            print("[WARNING] Supabase credentials not found, using empty interests")
            return {}
        
        supabase = create_client(supabase_url, supabase_key)
        
        # Fetch user_interests with interest names
        response = supabase.table("user_interests").select("user_id, interests(name)").execute()
        
        user_interests_map = {}
        for row in response.data:
            user_id = row["user_id"]
            interest_name = row["interests"]["name"] if row["interests"] else None
            if interest_name:
                if user_id not in user_interests_map:
                    user_interests_map[user_id] = []
                user_interests_map[user_id].append(interest_name)
        
        return user_interests_map
    
    def push_to_supabase(self, recommendations):
        """Push recommendations to Supabase recommendations_metadata table."""
        from supabase import create_client
        
        supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("Missing Supabase credentials in environment")
        
        supabase = create_client(supabase_url, supabase_key)
        
        # Helper to convert numpy scalars to native Python
        def _to_py(v):
            try:
                import numpy as _np
                if isinstance(v, (_np.generic,)):
                    return v.item()
            except Exception:
                pass
            return v

        # Delete existing recommendations for these users (preserve original types)
        user_ids = list({ _to_py(r["user_id"]) for r in recommendations })
        print(f"[{datetime.now().isoformat()}] Clearing old recommendations for {len(user_ids)} users...")
        supabase.table("recommendations_metadata").delete().in_("user_id", user_ids).execute()
        
        # Insert new recommendations in batches
        batch_size = 100
        for i in range(0, len(recommendations), batch_size):
            batch_raw = recommendations[i:i + batch_size]
            # Sanitize numpy types to native Python types without coercing UUIDs/strings to ints
            batch = []
            for r in batch_raw:
                batch.append({
                    "user_id": _to_py(r["user_id"]),            # uuid
                    "entity_type": str(r["entity_type"]),        # 'group' | 'event' | 'user'
                    "entity_id": str(_to_py(r["entity_id"])),    # text column
                    "score": float(r["score"]),                   # real
                })
            supabase.table("recommendations_metadata").insert(batch).execute()
            print(f"[{datetime.now().isoformat()}] Inserted batch {i//batch_size + 1}/{(len(recommendations) + batch_size - 1)//batch_size}")
        
        print(f"[{datetime.now().isoformat()}] Successfully pushed {len(recommendations)} recommendations to Supabase")
