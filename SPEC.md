# Planning Spec — Hall of Mirrors

> This is the original design document that drove development, imported from my Notion
> planning workspace. It's kept in the repo so the project reads as *plan → build*: you can
> trace almost every shipped mechanic back to a line here. Two layers are captured below —
> the **v1 scope that actually shipped**, and the **master vision / roadmap** it was carved from.

**Source material:** the climactic mirror-room duel between Bruce and Han in *Enter the Dragon*
(1973) — [reference scene](https://www.youtube.com/watch?v=aw4dTY2mPOg). The room is lined with
mirrors; every pane shows the enemy, but only one reflection is real. Break the illusion to win.

---

## Part 1 — v1 Spec (shipped)

This is the trimmed, buildable slice that became [v1.0.0](CHANGELOG.md).

### Visual design
- Pixelated cartoon styling.
- Glass should feel immersive / close to 360°.
- Villain embedded into the glass panes, identical across every pane.
- Breaking of glass should feel jarring.

### Core gameplay
- See multiple mirrors, each showing the villain.
- Choose which mirror position to attack.
- **Correct guess** → damage to the enemy.
- **Incorrect guess** → damage to the hero, *but* that pane shatters and the enemy can no longer
  be hiding in that position.
- Enemy starting position is randomized.
- Enemy always relocates to a new random position after a correct guess.
- Glass breaks on a correct guess.
- Glass also breaks on an incorrect guess — and the **orientation / amount of cracking is a clue**
  to the enemy's real position (a logic-puzzle layer):
  - **1 crack** → enemy is in an adjacent pane.
  - **2 cracks** → enemy is two positions away (either side).
  - **3 cracks** → enemy is three positions away (either side).
  - **4+ cracks** → enemy is four or five positions away (either side).
- Hero loses health on incorrect guesses; game over if too many misses.
- Villain loses health on correct guesses; win if enough hits land.
- Consecutive correct guesses build a damage/score **multiplier** (enables high scores; also
  became a genuine strategic lever in playtesting).
- Score based on **time × correct guesses**.

### Worked examples (playtesting the math)

**Example 1 — no clues, missed early**
```
10 panes — player breaks 1, fail
 9 remain — player breaks 5, fail        (Bruce 3/5, Han 5/5)
 8 remain — player strikes 9, hit
 8 remain — player breaks 2, fail
 7 remain — player strikes 3, hit        (Bruce 2/5, Han 3/5)
 7 remain — player breaks 9, fail        (Bruce 1/5, Han 3/5)  broken: 1,2,5,9
 7 remain — player strikes 7, hit
 7 remain — player strikes 10, hit       (Bruce 1/5, Han 1/5)
 → next guess decides the match; no clues since the player missed too much early
```

**Example 2 — running out of clues**
```
10 panes — player breaks 4, fail
 9 remain — player strikes 6, hit        (Bruce 4/5, Han 4/5)
 9 remain — player breaks 7, fail
 8 remain — player strikes 8, hit        (Bruce 3/5, Han 3/5)  broken: 4,8
 8 remain — player breaks 2, fail
 7 remain — player breaks 9, fail        (Bruce 1/5, Han 3/5)  broken: 2,4,8,9
 6 remain — player strikes 7, hit
 → player is left gambling with ~1/5 odds to finish
```

---

## Part 2 — Master Vision & Roadmap (not yet built)

The v1 spec above was carved out of a broader concept. These ideas are **documented as intent,
not implemented** — they form the roadmap in [CHANGELOG.md](CHANGELOG.md).

### Design questions that shaped the shipped tuning
Early playtests showed the game could lean too heavily on lucky guesses. Options weighed:
1. Increase player health (keep the luck).
2. Give clues on misses. ✅ *(shipped — the crack-count system)*
3. Decrease the number of panes.
4. Break mirrors on hits too. ✅ *(shipped)*

The chosen combo — **clues on misses + mirrors breaking on both hits and misses** — turns each run
into a solvable logic puzzle with a real skill ceiling, while keeping an exciting element of chance
from the randomized enemy position. There's even a deliberate-miss line of play (intentionally
shatter panes to narrow the odds later), which rhymes nicely with the strategy of the movie scene.

### Visual / feel (future)
- Hero body takes visible cuts as health depletes.
- Villain bleeds progressively as health depletes.
- Spinning **spear intro** animation + movie-quote audio.
- Spinning **impaled exit** animation + movie-quote audio.
- Victory / replay animations.

### Audio (future)
- Chimes / harp ambience.
- Karate-kick + Bruce Lee "heeyah" strike sound.

### Modes & progression (future)
- Difficulty slider — vary health, pane count, and score multiplier (à la sports-game
  online-tuning presets).
- Standard leveling → in-game currency for common cosmetic customizations.
- Leaderboards / weekly high-score contests.

### Monetization & Web3 (future / exploratory)
- Unlockable gameplay customizations.
- NFTs for special characters, character skins, and villain hands / weapons.
- NFT victory animation (thumbs up) and replay animation.

> **Note:** the Web3 layer is exploratory roadmap only. Nothing crypto-related ships in the current
> game — v1.0.0 is a self-contained, offline, no-dependency browser game.
