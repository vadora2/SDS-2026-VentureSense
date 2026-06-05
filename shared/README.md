# Shared

This folder contains shared project definitions used by both the customer ordering page and admin dashboard.

## Contents

```txt
shared/
├── types/
│   └── index.ts
└── constants/
    └── status.ts
```

## Rule

Do not invent new status names in different parts of the project. Import or copy from the shared constants instead.
