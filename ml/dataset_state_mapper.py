import numpy as np
import torch

# -----------------------------------
# Hobby → embedding mapping
# -----------------------------------
def embed_hobbies(hobbies, embed_dim):
    """
    Converts a list of hobbies into a numeric embedding.
    For now: simple hashing-based embedding (deterministic).
    Can be replaced later with Word2Vec / BERT / etc.
    """
    rng = np.random.default_rng(abs(hash(" ".join(sorted(hobbies)))) % (2**32))
    embedding = rng.normal(size=embed_dim)
    return embedding.astype(np.float32)


# -----------------------------------
# Build model state from dataset
# -----------------------------------
def build_state_from_dataset(
    user_record,
    env,
    device
):
    """
    user_record example:
    {
        "user_id": 12,
        "hobbies": ["photography", "music", "AI"],
        "joined_groups": [6, 22, 41]
    }
    """

    embed_dim = env.embed_dim
    seq_len = env.seq_len

    # 1️⃣ Build user embedding from hobbies
    user_embed = embed_hobbies(user_record["hobbies"], embed_dim)

    # 2️⃣ Build last interaction sequence
    last_seq = user_record.get("joined_groups", [])[-seq_len:]
    if len(last_seq) < seq_len:
        last_seq = [0] * (seq_len - len(last_seq)) + last_seq

    last_seq = np.array(last_seq, dtype=int)
    last_seq = np.clip(last_seq, 0, env.num_groups - 1)

    # 3️⃣ Convert last_seq → item embeddings
    last_emb = env.group_embeddings[last_seq].mean(axis=0)

    # 4️⃣ Final state vector
    state = np.concatenate([user_embed, last_emb]).astype(np.float32)

    return torch.tensor(state).unsqueeze(0).to(device)







if __name__ == "__main__":
    from reco_env import SequentialRecEnv

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    env = SequentialRecEnv(
        num_groups=50,
        embed_dim=8,
        seq_len=5
    )

    sample_user = {
        "user_id": 12,
        "hobbies": ["photography", "music", "AI"],
        "joined_groups": [6, 22, 41]
    }

    state = build_state_from_dataset(sample_user, env, device)
    print("State shape:", state.shape)
    print("State tensor:", state)
