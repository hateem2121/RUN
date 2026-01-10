export const useAuth = () => {
  return {
    user: { email: "admin@runapparel.com", id: "admin-1" },
    isLoading: false,
    isAuthenticated: true,
    isAdmin: true,
  };
};

export const login = (returnUrl?: string) => {
  // biome-ignore lint/suspicious/noConsole: debugging
  console.log("Mock login called with returnUrl:", returnUrl);
  // In a real app, this would redirect to login provider
  window.location.href = "/login";
};

export const logout = () => {
  // biome-ignore lint/suspicious/noConsole: debugging
  console.log("Mock logout");
  window.location.href = "/";
};
