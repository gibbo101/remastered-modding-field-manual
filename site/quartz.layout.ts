import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      "Source on GitHub": "https://github.com/gibbo101/remastered-modding-field-manual",
      "Licence: CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
    },
  }),
}

// Getting started leads the sidebar: build.sh replaces README_ORDER with it and its pages, in the README's order.
const explorer = () =>
  Component.Explorer({
    sortFn: (a, b) => {
      // No inner named functions: the explorer runs this function's source in the browser, without the bundler's helpers.
      const order: string[] = README_ORDER
      const ia = order.indexOf(a.slugSegment ?? "")
      const ib = order.indexOf(b.slugSegment ?? "")
      const diff = (ia < 0 ? order.length : ia) - (ib < 0 ? order.length : ib)
      if (diff !== 0) return diff
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
      return a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: "base" })
    },
  })

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    explorer(),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    explorer(),
  ],
  right: [],
}
