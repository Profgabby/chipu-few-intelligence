# CHIPU-FEW Persistence Security

The current application does not yet have end-user organization authentication. New CHIPU-FEW tables therefore follow the existing production research-database boundary: RLS is enabled and no anonymous policies are created. Netlify server functions use the service-role credential server-side and require the existing research-admin authorization contract. The browser never receives the Supabase service-role key.

The People/Place UI can accept the research access key for an authorized session. That value is stored in `sessionStorage` only and is sent to the protected Netlify function; it is not committed, compiled into Vite environment variables, or persisted in Supabase. This is a research-administration bridge, not the final multi-user identity architecture.

Future organization/user isolation should add authenticated researcher identities, organization/project membership, explicit `project_id` ownership, and RLS policies based on authenticated membership before public multi-user editing is enabled.
