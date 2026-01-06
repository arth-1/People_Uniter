# reco_env.py
import numpy as np
import gymnasium as gym
from gymnasium import spaces

class SequentialRecEnv(gym.Env):
    """
    Sequential recommendation environment (simulated users + groups).
    - Users: latent D-dim interest vectors.
    - Groups (items): latent D-dim embeddings.
    - State: last seq_len item IDs (integers) and user's embedding (we return combined vector).
    - Action: index of a group to recommend.
    - Reward: +1 if user "joins", +0.5 if "clicks", else 0.
    """

    metadata = {"render.modes": ["human"]}

    def __init__(
        self,
        num_groups=50,
        num_users=200,
        embed_dim=16,
        seq_len=5,
        max_steps=20,
        click_prob_scale=1.0,
        join_prob_scale=1.0,
        seed: int | None = None,
    ):
        super().__init__()
        self.rng = np.random.default_rng(seed)
        self.num_groups = num_groups
        self.num_users = num_users
        self.embed_dim = embed_dim
        self.seq_len = seq_len
        self.max_steps = max_steps

        # Latent embeddings
        self.group_embeddings = self.rng.normal(size=(num_groups, embed_dim)).astype(np.float32)
        # We'll sample a user per episode with its latent preference vector
        self.user_embeddings = self.rng.normal(size=(num_users, embed_dim)).astype(np.float32)

        # Observation: we will return a continuous vector combining:
        # - one-hot-ish or index list of last seq_len group ids (integers)
        # - user's embedding vector
        # For simplicity, observation will be concatenated float vector: [user_embedding (D), last_seq (seq_len)]
        obs_low = np.concatenate([np.full(embed_dim, -np.inf), np.zeros(seq_len)])
        obs_high = np.concatenate([np.full(embed_dim, np.inf), np.full(seq_len, self.num_groups)])
        self.observation_space = spaces.Box(low=obs_low, high=obs_high, dtype=np.float32)

        # Action space: choose group index 0..num_groups-1
        self.action_space = spaces.Discrete(num_groups)

        # probs scaling
        self.click_prob_scale = click_prob_scale
        self.join_prob_scale = join_prob_scale

        # internal state
        self.current_user_id = None
        self.current_user_embed = None
        self.last_seq = None
        self.step_count = 0

    def reset(self, seed: int | None = None, options=None):
        if seed is not None:
            self.rng = np.random.default_rng(seed)

        # sample a user for this episode
        self.current_user_id = int(self.rng.integers(0, self.num_users))
        self.current_user_embed = self.user_embeddings[self.current_user_id].copy()

        # initialize last sequence to zeros (no interactions)
        self.last_seq = np.zeros(self.seq_len, dtype=np.int32)
        self.step_count = 0

        return self._get_obs(), {}

    def _get_obs(self):
        # concat: user embedding + last_seq indices as floats
        obs = np.concatenate([self.current_user_embed.astype(np.float32), self.last_seq.astype(np.float32)])
        return obs

    def step(self, action):
        assert 0 <= action < self.num_groups
        self.step_count += 1

        # compute similarity score between user and item
        item_embed = self.group_embeddings[action]
        sim = np.dot(self.current_user_embed, item_embed) / (
            (np.linalg.norm(self.current_user_embed) * np.linalg.norm(item_embed)) + 1e-8
        )
        # convert similarity (-1..1) to engagement probability (0..1)
        base_prob = (sim + 1.0) / 2.0  # map to [0,1]

        # click and join probabilities (click higher than join)
        click_prob = 0.5 * (base_prob * self.click_prob_scale + 0.1)  # ensure not zero
        join_prob = 0.2 * (base_prob * self.join_prob_scale + 0.05)

        # stochastic outcome
        rand = self.rng.random()
        reward = 0.0
        info = {"sim": float(sim), "click_prob": float(click_prob), "join_prob": float(join_prob)}

        if rand < join_prob:
            reward = 2.0  # user joins
            # update user embedding slightly toward the item to simulate preference change
            self.current_user_embed = (
                0.9 * self.current_user_embed + 0.1 * item_embed + self.rng.normal(scale=0.01, size=self.embed_dim)
            )
            info["outcome"] = "join"
        elif rand < click_prob + join_prob:
            reward = 0.5  # user clicked/viewed
            # small preference drift
            self.current_user_embed = (
                0.98 * self.current_user_embed + 0.02 * item_embed + self.rng.normal(scale=0.01, size=self.embed_dim)
            )
            info["outcome"] = "click"
        else:
            reward = 0.0
            info["outcome"] = "ignore"

        # update last sequence (shift left)
        self.last_seq = np.roll(self.last_seq, -1)
        self.last_seq[-1] = action

        done = self.step_count >= self.max_steps

        return self._get_obs(), float(reward), bool(done), False, info

    def render(self, mode="human"):
        print(f"User {self.current_user_id} step {self.step_count} last_seq={self.last_seq}")

    def seed(self, seed=None):
        self.rng = np.random.default_rng(seed)

