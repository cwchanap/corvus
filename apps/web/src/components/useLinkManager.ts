import { createSignal } from "solid-js";

export interface LinkItem {
  id?: string;
  url: string;
  description: string;
  isPrimary: boolean;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface UseLinkManagerOptions {
  onRemoveExisting?: (index: number, link: LinkItem) => void;
}

export function useLinkManager(
  initialLinks: LinkItem[] = [],
  options?: UseLinkManagerOptions,
) {
  const [links, setLinks] = createSignal<LinkItem[]>(initialLinks);

  const addLink = () => {
    setLinks((prev) => {
      return [
        ...prev,
        { url: "", description: "", isPrimary: false, isNew: true },
      ];
    });
  };

  const removeLink = (index: number) => {
    setLinks((prev) => {
      const link = prev[index];
      if (!link) return prev;

      // If it's a new link, remove it entirely
      if (link.isNew) {
        return prev.filter((_, i) => i !== index);
      } else {
        // If it's an existing link, mark it as deleted
        if (options?.onRemoveExisting) {
          options.onRemoveExisting(index, link);
        }
        return prev.map((l, i) =>
          i === index ? { ...l, isDeleted: true } : l,
        );
      }
    });
  };

  const removeAllLinks = () => {
    setLinks(
      (prev) =>
        prev
          .map((link) => (link.isNew ? null : { ...link, isDeleted: true }))
          .filter(Boolean) as LinkItem[],
    );
  };

  const updateLink = (
    index: number,
    field: keyof LinkItem,
    value: string | boolean,
  ) => {
    setLinks((prev) =>
      prev.map((link, i) => {
        if (i === index) {
          return { ...link, [field]: value };
        }
        return link;
      }),
    );
  };

  const resetLinks = (newLinks: LinkItem[] = []) => {
    setLinks(newLinks);
  };

  return {
    links,
    addLink,
    removeLink,
    removeAllLinks,
    updateLink,
    resetLinks,
  };
}
