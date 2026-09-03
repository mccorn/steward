export const ROUTES = {
    homePage: { url: "/home" },
    shopListPage: { url: "/" },
    reputationPage: { url: "/reputation" },
    listNew: { url: "/lists/new" },
    listPage: { url: (id: string) => `/lists/${id}` },
    listSettings: { url: (id: string) => `/lists/${id}/settings` },
}
