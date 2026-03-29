#!/usr/bin/env python3
"""Generate a network graph image for Braille art conversion.

Creates an organic-looking agent network: one central node spawning
connected nodes that branch outward.
"""
from __future__ import annotations
import random
import math
from PIL import Image, ImageDraw

def gen_network(
    width: int = 800,
    height: int = 600,
    nodes: int = 30,
    seed: int = 42,
    style: str = "network",  # "network" or "constellation"
) -> Image.Image:
    random.seed(seed)
    img = Image.new("L", (width, height), 255)
    draw = ImageDraw.Draw(img)

    # Place central node
    cx, cy = width // 2, height // 2
    positions = [(cx, cy)]
    edges = []

    # Grow outward from center
    for i in range(1, nodes):
        # Pick a random existing node to branch from
        parent_idx = random.randint(0, len(positions) - 1)
        px, py = positions[parent_idx]

        # Random angle and distance
        angle = random.uniform(0, 2 * math.pi)
        dist = random.uniform(60, 180)
        nx = int(px + dist * math.cos(angle))
        ny = int(py + dist * math.sin(angle))

        # Clamp to bounds
        nx = max(40, min(width - 40, nx))
        ny = max(40, min(height - 40, ny))

        positions.append((nx, ny))
        edges.append((parent_idx, i))

        # Occasionally add extra connections for mesh feel
        if random.random() < 0.3 and len(positions) > 3:
            other = random.randint(0, len(positions) - 2)
            if other != parent_idx:
                edges.append((other, i))

    if style == "constellation":
        # Thin dotted lines, small dots
        for p1, p2 in edges:
            x1, y1 = positions[p1]
            x2, y2 = positions[p2]
            draw.line([(x1, y1), (x2, y2)], fill=160, width=1)

        for i, (x, y) in enumerate(positions):
            r = 4 if i == 0 else random.randint(2, 3)
            draw.ellipse([x - r, y - r, x + r, y + r], fill=0)
    else:
        # Network style: thicker lines, bigger nodes
        for p1, p2 in edges:
            x1, y1 = positions[p1]
            x2, y2 = positions[p2]
            draw.line([(x1, y1), (x2, y2)], fill=80, width=2)

        for i, (x, y) in enumerate(positions):
            r = 10 if i == 0 else random.randint(4, 7)
            draw.ellipse([x - r, y - r, x + r, y + r], fill=0)

    return img


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--style", default="network", choices=["network", "constellation"])
    parser.add_argument("--nodes", type=int, default=30)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--width", type=int, default=800)
    parser.add_argument("--height", type=int, default=600)
    parser.add_argument("-o", "--output", required=True)
    args = parser.parse_args()

    img = gen_network(args.width, args.height, args.nodes, args.seed, args.style)
    img.save(args.output)
    print(f"Saved {args.style} ({args.width}x{args.height}, {args.nodes} nodes) to {args.output}")
