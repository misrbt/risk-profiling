export const getDefaultPathForUser = (user) => {
  const isAdmin = user?.roles?.some((role) => role.slug === "admin");
  const isCompliance = user?.roles?.some((role) => role.slug === "compliance");
  const isManager = user?.roles?.some((role) => role.slug === "manager");

  if (isAdmin) return "/admin/dashboard";
  if (isCompliance || isManager) return "/dashboard";
  return "/risk-form";
};
