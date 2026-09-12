import type { Filters, Opportunity } from "./types";

export const defaultFilters: Filters = {
  query: "",
  category: "all",
  languages: [],
  statuses: [],
  experience: [],
  sort: "recommended",
  savedOnly: false,
};

export function filterOpportunities(records: Opportunity[], filters: Filters, saved: string[]) {
  const query = filters.query.trim().toLowerCase();
  const filtered = records.filter((item) => {
    if (filters.savedOnly && !saved.includes(item.id)) return false;
    if (filters.category === "repositories" && item.category !== "open-source") return false;
    if (filters.category !== "all" && filters.category !== "repositories" && item.category !== filters.category) return false;
    if (filters.experience.length && !filters.experience.includes(item.experience)) return false;
    if (item.category === "open-source") {
      if (filters.languages.length && !filters.languages.includes(item.language)) return false;
      if (filters.statuses.length && !filters.statuses.includes(item.status)) return false;
      if (query) {
        const haystack = [item.owner, item.repo, item.title, item.summary, item.language, ...item.labels].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
    } else if (query) {
      const haystack = [item.organizer, item.title, item.summary, item.category, ...item.tags].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  return filtered.sort((a, b) => {
    if (filters.sort === "recent") return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    if (filters.sort === "closing") {
      const aDeadline = a.category === "open-source" ? Number.POSITIVE_INFINITY : Date.parse(a.deadlineAt ?? "");
      const bDeadline = b.category === "open-source" ? Number.POSITIVE_INFINITY : Date.parse(b.deadlineAt ?? "");
      return aDeadline - bDeadline;
    }
    const categoryScore = (item: Opportunity) => item.category === "open-source" ? 0 : 10;
    const availabilityScore = (item: Opportunity) => item.category !== "open-source" ? 0 : ({ unassigned: 0, "ask-first": 1, "possibly-claimed": 2, "linked-pr": 3, blocked: 4, unknown: 5, closed: 6 }[item.status]);
    const categoryDelta = categoryScore(a) - categoryScore(b);
    if (categoryDelta) return categoryDelta;
    if (a.category === "open-source" && b.category === "open-source") {
      if (filters.category === "repositories") {
        const aQuality = a.repositoryQuality?.score ?? -1;
        const bQuality = b.repositoryQuality?.score ?? -1;
        return bQuality - aQuality || (b.repositoryQuality?.coverage ?? 0) - (a.repositoryQuality?.coverage ?? 0) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      }
      const availabilityDelta = availabilityScore(a) - availabilityScore(b);
      if (availabilityDelta) return availabilityDelta;
      const aFeedScore = a.feedScore ?? -1;
      const bFeedScore = b.feedScore ?? -1;
      return bFeedScore - aFeedScore || (b.repositoryQuality?.coverage ?? 0) - (a.repositoryQuality?.coverage ?? 0) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    }
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}

export function activeFilterCount(filters: Filters) {
  return filters.languages.length + filters.statuses.length + filters.experience.length + (filters.query ? 1 : 0);
}
