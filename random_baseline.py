import numpy as np
from reco_env import SequentialRecEnv

# -----------------------------
# Random Policy Evaluation
# -----------------------------
env = SequentialRecEnv(
    num_groups=50,
    num_users=200,
    embed_dim=8,
    seq_len=5,
    max_steps=20
)

num_episodes = 300
reward_history = []

for episode in range(num_episodes):
    obs, _ = env.reset()
    done = False
    total_reward = 0.0

    while not done:
        # Random action (baseline policy)
        action = env.action_space.sample()
        obs, reward, done, _, _ = env.step(action)
        total_reward += reward

    reward_history.append(total_reward)
    avg_reward = np.mean(reward_history[-20:])

    print(f"Episode {episode+1}, Reward: {total_reward:.2f}, Avg(20): {avg_reward:.2f}")

print("\n========== RANDOM POLICY SUMMARY ==========")
print(f"Average reward over {num_episodes} episodes: {np.mean(reward_history):.2f}")
print("==========================================")
