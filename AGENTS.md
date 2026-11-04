<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Every tenant table carries organization_id and is protected by RLS via is_org_member/can_edit_org; never trust org ids from the client for privileged writes.
- Make integration lives in src/server/make.functions.ts (outbound) and src/routes/api/public/make/* (HMAC-signed inbound); secrets only via process.env.
- Match scoring is a pure function in src/lib/matching.ts so it can be tested and later swapped for AI (scenario 03).
- Setup/security docs: docs/SETUP.md.
