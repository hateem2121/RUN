

export async function loader() {
  return {
    success: true,
    data: {
      data: [], // Empty list of media assets
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    },
  };
}
