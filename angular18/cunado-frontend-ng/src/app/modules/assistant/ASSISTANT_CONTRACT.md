Assistant module - contract
===========================

Purpose
-------
This document describes the contract for the Assistant modal and its orchestration module used by legacy modals (assistant mode). It is intentionally minimal: the implementation scaffold will follow this contract exactly so we can validate and migrate behaviour in subsequent steps.

1) Inputs (what the assistant receives)
--------------------------------------
- data (object): general payload passed by caller. Typical properties (legacy):
  - `categorie` (object)
  - `listeSousPosteBudgetaire` (array|object)
  - `idBudget` (number)
  - `dateCalendrier` (string|Date)
  - `assistant` (boolean)

2) Outputs (what the assistant returns)
---------------------------------------
- On success, the assistant must close returning an object with the same shape legacy callers expect, typically:
  {
    sousPoste: <sousPosteBudgetaire object>,
    regle: <regle object>,
    image: <string|null>,
    typeImage: <string|null>
  }

- On cancel or failure it should either resolve to `false` or return an error envelope compatible with legacy callers.

3) Behaviour and flow
----------------------
- The assistant orchestrator drives a finite dialog/prompt flow. It will:
  1. Validate incoming data.
  2. Perform lookups (via `CuServicesAdapter`) to populate LOVs.
  3. Present steps to the user (UI) and collect selection(s).
  4. Return the chosen object(s) to the caller using the same modal.result semantics (Promise) as the legacy code.

4) Endpoints & adapter usage
----------------------------
- The orchestrator will use `CuServicesAdapter` to call legacy endpoints. Example calls:
  - `viSousPosteBudgetaire_getParCateg` to fetch LOV of sous-poste
  - `viPosteBudgetaire_getParCateg` to fetch postes
  - `viRegleSousPosteBudgetaire_getParBudgetCateg` to fetch comptes
  - `regle_create` / `regleException_create` etc. when persisting selections (but not in scaffold)

5) Error handling
-----------------
- Network/SQL errors from `CuServicesAdapter` must be passed back as `LegacyError` (adapter already maps SQLSTATE). The orchestrator will not swallow SQLSTATE errors silently.

6) Modal API
------------
- The modal factory exposes `open(settings)` returning an object with a `result: Promise<any>` property (legacy modal.result). That Promise resolves with the assistant output object or rejects on fatal error.

7) Test contracts
-----------------
- Unit tests must cover:
  - startAssistant happy path (returns expected object shape quickly via mocked adapter)
  - factory.open returns an object with `result` Promise
  - component creation and simple input/output wiring

Validation
----------
Do not migrate business logic yet. First deliver the scaffold and tests. Once contract and scaffold validated, we'll implement the assistant logic and migrate dependent modals.
