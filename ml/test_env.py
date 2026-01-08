# test_env.py
from reco_env import SequentialRecEnv
import numpy as np

env = SequentialRecEnv(num_groups=20, num_users=50, embed_dim=8, seq_len=5, max_steps=10, seed=42)

obs, _ = env.reset(seed=1)
print("obs shape:", obs.shape)
print("initial obs (user emb + seq):", obs[:5], obs[8:])

done = False
total_reward = 0.0
while not done:
    action = env.action_space.sample()  # random action
    obs, reward, done, truncated, info = env.step(action)
    total_reward += reward
    print(f"action {action} -> reward {reward}, outcome {info['outcome']}, sim {info['sim']:.3f}")
print("total reward:", total_reward)
