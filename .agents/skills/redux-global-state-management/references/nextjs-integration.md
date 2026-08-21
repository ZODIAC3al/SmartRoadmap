# Next.js App Router Integration

## Store provider

`provider.tsx` creates one store **per request** using `useRef<AppStore>()`, wrapped once at root `layout.tsx`.
Prevents cross-user state leaks during SSR.

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
```

## Server Components vs. Client Components

- **Server Components**: Fetch SEO/first-paint data directly from NestJS API (e.g. `/companies/[slug]`). Do NOT import Redux hooks.
- **Client Components** (`"use client"`): Use typed `useAppSelector` / `useAppDispatch` / RTK Query hooks.

## Theme persistence

- Source of truth during session: `uiSlice.theme`.
- Synced to `localStorage` and DaisyUI `data-theme` attribute via `themeListenerMiddleware.ts`.

## Hydration pitfalls

- Never seed `configureStore`'s `preloadedState` with non-deterministic values like `Date.now()` or direct `localStorage` reads.
- Always perform client storage reads inside `useEffect` or RTK listener middleware.
