-- Fix infinite recursion in memberships RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "Workspace admins can manage memberships" ON public.memberships;

-- Create a new policy using the SECURITY DEFINER function to avoid recursion
CREATE POLICY "Workspace admins can manage memberships"
ON public.memberships
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.has_workspace_role(auth.uid(), workspace_id, 'owner')
  OR public.has_workspace_role(auth.uid(), workspace_id, 'admin')
)
WITH CHECK (
  public.has_workspace_role(auth.uid(), workspace_id, 'owner')
  OR public.has_workspace_role(auth.uid(), workspace_id, 'admin')
);