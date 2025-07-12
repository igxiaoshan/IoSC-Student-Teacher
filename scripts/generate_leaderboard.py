import json

POINTS_FILE = "points.json"
LEADERBOARD_FILE = "LEADERBOARD.md"

def load_points():
    with open(POINTS_FILE, "r") as f:
        return json.load(f)

def generate_leaderboard(points_data):
    sorted_users = sorted(points_data.items(), key=lambda x: x[1], reverse=True)
    lines = ["# 🏆 Leaderboard\n", "\n| Rank | Username | Points |\n", "|------|----------|--------|\n"]
    for rank, (user, points) in enumerate(sorted_users, start=1):
        lines.append(f"| {rank} | {user} | {points} |\n")
    return lines

def save_leaderboard(lines):
    with open(LEADERBOARD_FILE, "w") as f:
        f.writelines(lines)

def main():
    points = load_points()
    leaderboard_lines = generate_leaderboard(points)
    save_leaderboard(leaderboard_lines)
    print("Leaderboard generated.")

if __name__ == "__main__":
    main()
