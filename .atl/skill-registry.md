# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
| --- | --- | --- |
| new skills, agent instructions, documenting AI usage patterns | skill-creator | C:\Users\JIMMY\.gemini\skills\skill-creator\SKILL.md |
| implementation, commit splitting, chained PRs, or keeping tests and docs with code | work-unit-commits | C:\Users\JIMMY\.gemini\skills\work-unit-commits\SKILL.md |
| Defining class responsibilities or splitting complex classes | solid-srp | C:\Users\JIMMY\.gemini\skills\solid-srp\SKILL.md |
| Adding new features or behaviors to existing code | solid-ocp | C:\Users\JIMMY\.gemini\skills\solid-ocp\SKILL.md |
| Inheritance, overriding methods, or using base types | solid-lsp | C:\Users\JIMMY\.gemini\skills\solid-lsp\SKILL.md |
| Defining interfaces, contracts, or implementing large interfaces | solid-isp | C:\Users\JIMMY\.gemini\skills\solid-isp\SKILL.md |
| Defining module dependencies, database access, or network calls | solid-dip | C:\Users\JIMMY\.gemini\skills\solid-dip\SKILL.md |
| NestJS modules, controllers, services, auth, refactoring | nestjs-best-practices | C:\Users\JIMMY\.agents\skills\nestjs-best-practices\SKILL.md |
| Supabase products, client libraries, auth, migrations, RLS | supabase | C:\Users\JIMMY\.agents\skills\supabase\SKILL.md |
| Designing class interactions, dependencies, or associations | poo-relationships | C:\Users\JIMMY\.gemini\skills\poo-relationships\SKILL.md |
| Using interfaces, abstract classes, or method overriding | poo-polymorphism | C:\Users\JIMMY\.gemini\skills\poo-polymorphism\SKILL.md |
| Creating sub-classes or extending existing functionality | poo-inheritance | C:\Users\JIMMY\.gemini\skills\poo-inheritance\SKILL.md |
| Defining class members, access modifiers, or data integrity rules | poo-encapsulation | C:\Users\JIMMY\.gemini\skills\poo-encapsulation\SKILL.md |
| Design of classes, interfaces, or domain models | poo-abstraction | C:\Users\JIMMY\.gemini\skills\poo-abstraction\SKILL.md |
| Switching between different algorithms at runtime | pattern-strategy | C:\Users\JIMMY\.gemini\skills\pattern-strategy\SKILL.md |
| Creating objects where the exact type varies or depends on conditions | pattern-factory-method | C:\Users\JIMMY\.gemini\skills\pattern-factory-method\SKILL.md |
| Managing shared resources like database connections, configurations, or logs | pattern-singleton | C:\Users\JIMMY\.gemini\skills\pattern-singleton\SKILL.md |
| Implementing one-to-many communication, UI events, or reactive systems | pattern-observer | C:\Users\JIMMY\.gemini\skills\pattern-observer\SKILL.md |
| Adding optional features without changing the core class | pattern-decorator | C:\Users\JIMMY\.gemini\skills\pattern-decorator\SKILL.md |
| Integrating complex third-party libraries, legacy modules, or multi-layered systems | pattern-facade | C:\Users\JIMMY\.gemini\skills\pattern-facade\SKILL.md |
| judgment day, dual review, adversarial review, juzgar | judgment-day | C:\Users\JIMMY\.gemini\skills\judgment-day\SKILL.md |
| creating GitHub issues, bug reports, or feature requests | issue-creation | C:\Users\JIMMY\.gemini\skills\issue-creation\SKILL.md |
| writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs | cognitive-doc-design | C:\Users\JIMMY\.gemini\skills\cognitive-doc-design\SKILL.md |
| PR feedback, issue replies, reviews, Slack messages, or GitHub comments | comment-writer | C:\Users\JIMMY\.gemini\skills\comment-writer\SKILL.md |
| PRs over 400 lines, stacked PRs, review slices | chained-pr | C:\Users\JIMMY\.gemini\skills\chained-pr\SKILL.md |
| creating, opening, or preparing PRs for review | branch-pr | C:\Users\JIMMY\.gemini\skills\branch-pr\SKILL.md |
| Postgres performance optimization, RLS, indexing | supabase-postgres-best-practices | C:\Users\JIMMY\.agents\skills\supabase-postgres-best-practices\SKILL.md |
| shadcn/ui, component registries, presets, styling, composition | shadcn | C:\Users\JIMMY\.agents\skills\shadcn\SKILL.md |
| web components, pages, artifacts, posters, or applications | frontend-design | C:\Users\JIMMY\.agents\skills\frontend-design\SKILL.md |
| how do I do X, find a skill for X, is there a skill that can... | find-skills | C:\Users\JIMMY\.agents\skills\find-skills\SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### skill-creator

- Skill body: target 180-450 tokens, hard max 1000.
- structure: Activation Contract, Hard Rules, Decision Gates, Execution Steps, Output Contract, References.
- `description` must be one physical line, quoted, and start with "Trigger: ".
- Frontmatter must include name, description, license, metadata.author, and metadata.version.
- Use imperative instructions, put templates in `assets/` and docs in `references/`.

### work-unit-commits

- Commit by work unit (deliverable behavior/fix), not by file type.
- Keep tests and docs in the same commit as the code change.
- Each commit message should explain the "why" and outcome, not just "what".
- Chained PRs recommended for changes >400 lines.
- Verification must be included in the same work unit/commit.

### solid-srp

- Every class must have only one reason to change.
- Encapsulate responsibility entirely within the class.
- Violation sign: if you use "and" to describe a class's responsibility.
- Separate concerns (e.g., logic vs. printing vs. persistence).

### solid-ocp

- Entities should be open for extension but closed for modification.
- Use interfaces or abstract classes to define contracts.
- Avoid growing switch/if-else blocks; use polymorphism instead.
- New features should not require touching existing, tested code.

### solid-lsp

- Subclasses must be substitutable for their base types without breaking correctness.
- Return types: same or more concrete; parameters: same or more abstract.
- Do not throw new exception types not expected by the base class.
- Do not strengthen pre-conditions or weaken post-conditions.

### solid-isp

- Prefer multiple small, specific interfaces over one "fat" interface.
- Clients should not depend on methods they don't use.
- Implementation can use multiple interfaces to satisfy requirements.
- Decouple clients from unused responsibilities.

### solid-dip

- Both high-level and low-level modules must depend on abstractions.
- Abstractions must not depend on details; details must depend on abstractions.
- Use Dependency Injection (constructor preferred) to inject dependencies.
- Define interfaces for low-level details (DB, External APIs).

### nestjs-best-practices

- Architecture: Organize by feature modules, not technical layers.
- Avoid circular dependencies (#1 crash cause).
- Use proper module sharing (singleton instances) with `exports`.
- Services: Focused responsibility (SRP), avoid "god services".
- Dependency Injection: Prefer constructor injection; use tokens for interfaces.
- Error Handling: Throw HTTP Exceptions from services; use Exception Filters.
- Security: Secure JWT (short-lived), validate all input (class-validator), use Guards.
- Database: Use Repository pattern, migrations, and avoid N+1 queries.

### supabase

- Verify against current docs/changelog (Supabase changes fast).
- Enable RLS on every table in exposed schemas (public).
- Never use `user_metadata` for auth decisions; use `app_metadata`.
- Storage upsert requires INSERT + SELECT + UPDATE permissions.
- CLI: Discover commands via `--help`; structure changes often.
- Schema changes: Use `execute_sql` for iteration, `db pull` for migrations.

### poo-relationships

- Dependency: Weak relation (e.g., as parameter).
- Association: Permanent relation (e.g., field in a class).
- Favor abstractions over concrete classes to reduce coupling.
- Aim for loose coupling to allow independent changes.

### poo-polymorphism

- Uniform processing: Write code that works with abstractions.
- Common interface: All polymorphic objects must share a base class/interface.
- Runtime dispatch: Real class detected at runtime for specific implementation.

### poo-inheritance

- Use only for clear "is-a" relationships.
- Subclasses must be able to replace parents (LSP).
- Composition over inheritance if it's a "has-a" relationship.
- Keep base classes stable as changes affect all children.

### poo-encapsulation

- Private state by default; controlled access via public methods/getters.
- Hide implementation details to reduce coupling.
- Ensure object invariants are protected after any operation.

### poo-abstraction

- Focus on relevant data and behaviors for the context.
- Use interfaces or abstract classes to define contracts.
- Hide the "how" (implementation) behind the abstraction.

### pattern-strategy

- Use for different variants of an algorithm within an object.
- Avoid massive conditionals; isolate implementation details.
- Strategy Interface defines the contract; Concrete Strategies implement it.

### pattern-factory-method

- Delegate instantiation to subclasses when exact class is unknown.
- Products must implement a common interface.
- Creator depends only on the product interface, not concrete classes.

### pattern-singleton

- Private constructor + static access method (e.g., `Instance`).
- Use for shared resources (DB, Logger) where global consistency is vital.
- Ensure thread safety and use lazy initialization.

### pattern-observer

- Subject maintains subscribers and notifies them of state changes.
- Loose coupling: Subject doesn't know concrete observer classes.
- Used for one-to-many communication and reactive notifications.

### pattern-decorator

- Wrap original object with same interface to add responsibilities.
- Layering: Stack decorators to combine multiple behaviors.
- Flexible alternative to subclassing; extension via composition.

### pattern-facade

- Simple entry point to a complex subsystem.
- Decouple clients from multiple subsystem classes.
- Primarily delegates work; should not add new business logic.

### judgment-day

- Blind dual review by two parallel agents; never review yourself.
- Resolve project skills and inject compact rules into judges.
- Classify warnings as real vs theoretical (Theoretical = INFO).
- Two fix iterations max before asking the user; terminal states: APPROVED or ESCALATED.

### issue-creation

- Every issue needs `status:needs-review`; must be `status:approved` before PR.
- Use templates (Bug Report/Feature Request); blank issues disabled.
- Questions go to Discussions, not issues.
- fill all required fields and check pre-flight checkboxes.

### comment-writer

- Be useful fast: Actionable point first.
- Be warm and direct (natural, teammate tone).
- Rioplatense Spanish/voseo for Spanish replies (`podés`, `tenés`).
- Match thread language; explain "why" when asking for changes.

### cognitive-doc-design

- Lead with the answer/decision; context comes after.
- Progressive disclosure: Happy path first, then details.
- Use chunking and signposting for scannability.
- Tables, checklists, and examples over long prose.

### chained-pr

- Split PRs over 400 changed lines into reviewable units.
- Keep tests/docs with the code unit they verify.
- Include dependency diagram with 📍 in every child PR.
- PRs should be reviewable in ≤60 minutes.

### branch-pr

- Branch name: `type/description` (e.g., `feat/user-login`).
- Conventional Commits: `type(scope): description`.
- Every PR must link an approved issue (`Closes #N`).
- Exactly one `type:*` label required per PR.

### supabase-postgres-best-practices

- Query Performance: Prioritize index types (composite, partial, covering).
- Security: RLS performance basics; avoid `security definer` in exposed schemas.
- Schema: primary keys, lowercase identifiers, foreign key indexes.
- Data patterns: batch inserts, UPSERT, and pagination.

### shadcn

- Compose components from registries, don't reinvent.
- No `space-x/y`; use `flex` with `gap`.
- Use `size-*` for equal dimensions.
- Form layout: `FieldGroup` + `Field`.
- Pass icons as objects, not string keys.

### frontend-design

- Avoid generic "AI slop"; pick a BOLD aesthetic direction.
- Typography: unique, interesting fonts; unexpected pairings.
- Motion: high-impact page load reveals; scroll-triggering.
- Spatial Composition: asymmetry, grid-breaking, generous negative space.

### find-skills

- Search via `npx skills find`.
- Verify quality (installs >1k, source reputation) before recommending.
- `npx skills add <package>` to install.

## Project Conventions

| File | Path | Notes |
| --- | --- | --- |
| NestJS AGENTS.md | C:\Users\JIMMY\.agents\skills\nestjs-best-practices\AGENTS.md | Comprehensive NestJS rules index |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
