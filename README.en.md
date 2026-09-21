# PostTrain Atlas · An Interactive Atlas of LLM Post-Training

**From "the model can talk" to "the model can finish tasks" — an interactive companion to a full-length book on LLM post-training.**

[中文版 README](README.md)

PostTrain Atlas compresses a 791-page book on LLM post-training into an actionable learning map: **6 parts, 26 chapters, 8 core formulas, and 1 production playbook**. It answers a single core question — how to turn the probability distribution produced by pre-training into a policy that reliably pursues goals, uses tools, accepts verification, and completes tasks over long horizons.

The book's one-sentence thesis: **algorithm names will change, but four things carry the load — whether feedback is trustworthy, whether samples carry gradient, whether credit reaches the right actions, and whether measurement sees real progress.** Optimize verifiers, environments, and diagnostics before optimizing the loss function.

---

## Site Structure

The site is organized into four workspaces, one per way of reading:

| Workspace | What it is | When to use it |
|---|---|---|
| **Overview** | The one-sentence thesis, the full post-training pipeline, a six-part knowledge map, a "what is already established" consensus list, and a 3-minute self-test | First visit — build the global frame quickly |
| **Chapter Atlas** | All 26 chapters. Each answers exactly three things: what problem it solves, the most defensible conclusion, and what to do in practice. Filterable by part, full-text searchable, with per-chapter completion tracking | Systematic study, or looking up a specific problem |
| **Formula Lab** | Parameter-by-parameter readings of the 8 core formulas, plus two interactive simulations: how reward reshapes probability, and pass@k vs. degenerate groups | When a formula blocks you — understand what each quantity controls first |
| **Playbook** | A symptom diagnostic (5 typical failure modes → mechanism → action list), a 7-stage production loop, a 12-item pre-flight checklist, and a method-selection decision tree | When training is actually broken, start debugging here |

Learning progress is stored locally in the browser.

---

## The Six Parts

### Part 1 · Foundations (Ch. 1–4) — Language Models as Policies

> Pre-training only reproduces the corpus distribution; it cannot reliably select good behavior. This part builds the formal language of the whole book.

- **Ch. 1 · The Post-Training Paradigm** — The master frame: post-training maximizes feedback in the vicinity of a reference policy; format, preference, capability, and agency are four distinct gaps; "verification is cheaper than generation" is the era's engine.
- **Ch. 2 · Language Models as Policies** — Token-level MDPs and sequence-level bandits share one objective but lead to different estimators; long sequences amplify importance ratios and variance.
- **Ch. 3 · Supervised Fine-Tuning** — SFT is imitation learning: good at seeding behavior, bad at recovering from states the model itself creates; excess SFT causes forgetting and memorization.
- **Ch. 4 · Data for Post-Training** — What data is worth producing: verifiable prompts keep generating fresh gradient as the policy updates; for group-relative RL, prompts that are too hard or too easy contribute almost nothing.

### Part 2 · Feedback & Alignment (Ch. 5–9) — From Preference to Online Optimization

> How comparisons by humans or models become an optimizable scalar, and then a probability update.

- **Ch. 5 · Preferences & Reward Models** — Bradley–Terry only identifies per-prompt reward differences; the effective radius of a frozen reward model should be measured in policy KL.
- **Ch. 6 · Policy Gradients** — How reward actually changes output probabilities: algorithms differ mainly in advantage estimation and trust regions, not in their names.
- **Ch. 7 · RLHF Engineering Practice** — Why theoretically identical PPO implementations produce completely different results: implementation details often matter more than the clipped objective itself.
- **Ch. 8 · Direct Alignment Algorithms** — DPO is reparameterized maximum likelihood on the KL-regularized optimal policy, not RL; it is cheap, but exhibits likelihood displacement and structural length bias.
- **Ch. 9 · Online, Iterative & Game-Theoretic Methods** — Why the same loss on current-policy data is often stronger: iteration's value is generating relevant negatives; non-transitive preferences are better modeled as games.

### Part 3 · Reasoning (Ch. 10–15) — Verifiers, RLVR & Credit

> Should the inference budget go to longer, more, filtered, or searched generation? This is the most contested territory today.

- **Ch. 10 · Reasoning & Test-Time Compute** — Chain-of-thought is serial computation with no guarantee of faithful explanation; verifiers convert coverage into reliable answers, and quality usually beats sample count.
- **Ch. 11 · Reinforcement Learning with Verifiable Rewards** — RLVR replaces reward models with programs; R1-Zero shows outcome rewards can induce backtracking and self-checking, but full capability comes from the whole pipeline.
- **Ch. 12 · Anatomy of GRPO** — Does GRPO's gain come from policy gradients or bookkeeping? The largest effects often come from length and group-std normalization; degenerate groups keep shrinking the effective batch.
- **Ch. 13 · Credit Assignment & Process Supervision** — How the final reward should be distributed across a long chain: finer credit trades bias for variance; PRMs suit re-ranking, with weaker evidence as training rewards.
- **Ch. 14 · What RL Actually Teaches** — Discovery of new capability or sharpening of existing behavior? The safer answer is "discovery first, sharpening after"; rising pass@1 does not imply rising large-k coverage.
- **Ch. 15 · Beyond Verifiable Domains** — Tasks like writing and research that admit no exact acceptance test: verifiability is a spectrum; multiplicative gating beats adding program and judge scores.

### Part 4 · Agents (Ch. 16–20) — Tools, Environments & Long Horizons

> Once the environment enters the loop, the assumptions of single-turn language RL fail one by one.

- **Ch. 16 · From Reasoning to Agency** — Trajectories are jointly generated by policy and environment; the problem becomes a POMDP; observation tokens are not policy actions — training on them teaches the model to fabricate tool outputs.
- **Ch. 17 · Tool-Integrated RL** — How to make the model call the right tool at the right time: rewarding call counts selects low-information queries; price tool calls explicitly.
- **Ch. 18 · Long-Horizon Agentic RL** — Why hundred-turn tasks break single-turn recipes: reward sparsity, context, sampling cost, and variance all worsen with horizon.
- **Ch. 19 · Environments, Sandboxes & Task Supply** — Environment quality is itself part of the reward function; fixed task pools deplete quickly — task and verifier supply is the real bottleneck.
- **Ch. 20 · Multi-Agent & Self-Play** — What matters is not the number of roles but whether parameters and rewards are shared; trajectory-level reward gives unrelated roles equally loud noise, causing role collapse.

### Part 5 · Systems (Ch. 21–23) — Throughput, Mismatch & Cost

> How to arrange sampling, training, synchronization, and environments so GPUs never wait.

- **Ch. 21 · Large-Scale Post-Training Systems** — Generation dominates the bill; weight sync and stragglers are hidden costs; asynchrony is not a switch but a staleness bound that must be controlled.
- **Ch. 22 · Sampling–Training Mismatch** — The same weights may not be the same policy on the inference engine and the training engine; small per-token gaps accumulate along long sequences and destroy ESS.
- **Ch. 23 · Efficiency & Cost Control** — Where the next unit of compute should go — sampling, training, distillation, or data: most engineering optimizations move the speed of reaching a level, not the capability ceiling.

### Part 6 · Measurement & Safety (Ch. 24–26) — Knowing Whether You Actually Improved

> Rising reward is not evidence of success. The final three chapters are about not fooling yourself.

- **Ch. 24 · Evaluation & Measurement** — A 2–5 point gain on a small benchmark is often below the noise floor; single-seed ablations are especially untrustworthy; prefer paired tests and multiple seeds.
- **Ch. 25 · Safety Alignment & Robustness** — Safety is five different problems; standard objectives usually produce only shallow alignment; prompt injection is a privilege-separation failure, not a refusal failure.
- **Ch. 26 · Open Problems & Frontiers** — As of mid-2026: the most reliable consensus concerns mechanisms and measurement principles, not algorithm rankings; long-horizon credit, environment supply, and system mismatch remain unsolved.

---

## The Eight Core Formulas

The Formula Lab distills the book into 8 dashboards, each with parameter readings and intuition:

| Formula | What it controls |
|---|---|
| Unified objective `J(θ)=E[r(x,y)]−βD_KL(πθ‖πref)` | Pursuing reward while keeping the policy near a reference model |
| KL-regularized optimal policy | How reward reshuffles the base policy's probabilities rather than inventing behavior |
| Policy gradient | Turning one trajectory-level score into per-action updates |
| PPO clipped objective | Preventing a single update from pushing the new policy too far from the sampling policy |
| DPO | Optimizing directly from preference pairs without online sampling |
| GRPO group advantage | Building a baseline from relative scores within a prompt group, no critic needed |
| pass@k | The probability of at least one success in k samples |
| Long-sequence effective sample size | How many effective samples remain after numeric mismatch accumulates along long sequences |

---

## Who It's For

- **Engineers** running RLHF / RLVR / agentic RL experiments and stuck on problems like "reward goes up while real evals drop" — start from the symptom diagnostic in the **Playbook**;
- **Researchers and learners** building a systematic post-training framework — enter via the **Overview** and work through the **Chapter Atlas** part by part;
- **Anyone preparing interviews or reading-group talks** — each chapter's "problem / conclusion / action" triad is a ready-made outline.

## Run Locally

Built on [vinext](https://github.com/cloudflare/vinext) (Cloudflare's full-stack framework); requires Node.js ≥ 22.13:

```bash
npm run install:ci   # one-time locked dependency install
npm run dev          # start the dev server (default port 5173)
```

---

*Content distilled from the 2026·07 edition of the book.*
