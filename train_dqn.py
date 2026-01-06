import torch
import numpy as np
from reco_env import SequentialRecEnv
from dqn_agent import DQNAgent

# -----------------------------
# State preprocessing
# -----------------------------
def preprocess_obs(obs, env, device):
    embed_dim = env.embed_dim
    user_embed = obs[:embed_dim]
    last_seq = obs[embed_dim:].astype(int)

    last_seq = np.clip(last_seq, 0, env.num_groups - 1)
    last_emb = env.group_embeddings[last_seq].mean(axis=0)

    state = np.concatenate([user_embed, last_emb]).astype(np.float32)
    return torch.tensor(state).unsqueeze(0).to(device)



# -----------------------------
# Training
# -----------------------------
env = SequentialRecEnv(
    num_groups=50,
    num_users=200,
    embed_dim=8,
    seq_len=5,
    max_steps=20
)

input_dim = env.embed_dim * 2
agent = DQNAgent(input_dim=input_dim, action_dim=env.num_groups)

num_episodes = 300
reward_history = []

for episode in range(num_episodes):
    obs, _ = env.reset()
    state = preprocess_obs(obs, env, agent.device)

    total_reward = 0

    done = False
    while not done:
        action = agent.select_action(state)
        next_obs, reward, done, _, _ = env.step(action)
        next_state = preprocess_obs(next_obs, env, agent.device)

        agent.buffer.push(state, action, reward, next_state, done)
        agent.train_step()

        state = next_state
        total_reward += reward

    reward_history.append(total_reward)
    avg_reward = np.mean(reward_history[-20:])

    print(f"Episode {episode+1}, Reward: {total_reward:.2f}, Avg(20): {avg_reward:.2f}")

torch.save(agent.q_net.state_dict(), "dqn_recommender.pth")
print("Model saved as dqn_recommender.pth")
