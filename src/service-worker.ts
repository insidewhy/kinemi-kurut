const BOOKMARK_TITLE = 'Tab Groups'

async function selectTab(offset: number): Promise<void> {
  const tabs = await chrome.tabs.query({ currentWindow: true })
  const activeIndex = tabs.findIndex(tab => tab.active)
  const nextIndex = (activeIndex + offset + tabs.length) % tabs.length
  if (activeIndex === -1) {
    return
  }

  const toActivate = tabs[nextIndex]
  if (toActivate) {
    chrome.tabs.update(toActivate.id!, { active: true })
  }
}

async function selectNextTabGroup(): Promise<void> {
  const tabs = await chrome.tabs.query({ currentWindow: true })
  const activeIndex = tabs.findIndex(tab => tab.active)
  const currentGroupId = tabs[activeIndex]?.groupId

  for (let i = (activeIndex + 1) % tabs.length; i != activeIndex; i = (i + 1) % tabs.length) {
    const tab = tabs[i]
    const groupId = tab?.groupId
    if (groupId !== undefined && groupId !== -1 && groupId !== currentGroupId) {
      chrome.tabs.update(tab.id!, { active: true })
      break
    }
  }
}

async function selectPreviousTabGroup(): Promise<void> {
  const tabs = await chrome.tabs.query({ currentWindow: true })
  const activeIndex = tabs.findIndex(tab => tab.active)
  const currentGroupId = tabs[activeIndex]?.groupId

  for (
    let i = (activeIndex + tabs.length - 1) % tabs.length;
    i != activeIndex;
    i = (i + tabs.length - 1) % tabs.length
  ) {
    const tab = tabs[i]
    const groupId = tab?.groupId
    if (groupId === undefined || groupId === -1 || groupId === currentGroupId) {
      continue
    }

    for (
      let j = (i + tabs.length - 1) % tabs.length;
      j !== i;
      j = (j + tabs.length - 1) % tabs.length
    ) {
      if (tabs[j]?.groupId !== groupId) {
        chrome.tabs.update(tabs[(j + 1) % tabs.length].id!, { active: true })
        break
      }
    }
    break
  }
}

async function bookmarkTabGroups(): Promise<void> {
  const bookmarks = await chrome.bookmarks.search({ title: BOOKMARK_TITLE })
  if (bookmarks.length) {
    await chrome.bookmarks.removeTree(bookmarks[0].id)
  }
  const { id: parentFolderId } = await chrome.bookmarks.create({ title: BOOKMARK_TITLE })
  const tabs = await chrome.tabs.query({ currentWindow: true })

  let folderIdForGroup: string | undefined
  let tabGroup: chrome.tabGroups.TabGroup | undefined
  for (const tab of tabs) {
    const groupId = tab?.groupId
    if (groupId === undefined || groupId === -1) {
      continue
    }
    if (groupId !== tabGroup?.id) {
      tabGroup = await chrome.tabGroups.get(groupId)
      folderIdForGroup = (
        await chrome.bookmarks.create({
          title: `${tabGroup.color}:${tabGroup.title}`,
          parentId: parentFolderId,
        })
      ).id
    }

    await chrome.bookmarks.create({
      title: tab.title,
      url: tab.url,
      parentId: folderIdForGroup,
    })
  }
}

async function restoreTabGroups(): Promise<void> {
  const bookmarks = await chrome.bookmarks.search({ title: BOOKMARK_TITLE })
  if (!bookmarks.length) {
    return
  }

  let nextTabIndex = 0
  const groupsFromBookmarks = await chrome.bookmarks.getChildren(bookmarks[0].id)
  for (const groupFromBookmark of groupsFromBookmarks) {
    const color = groupFromBookmark.title.split(':', 1)[0] as chrome.tabGroups.Color
    const title = groupFromBookmark.title.replace(/^.*?:/, '')

    // TODO: do not close tabs that may be reused
    // search for tab group already existing and remove its tabs if necessary
    const existingGroups = await chrome.tabGroups.query({ title, color })
    if (existingGroups.length) {
      for (const existingGroup of existingGroups) {
        const existingGroupTabs = await chrome.tabs.query({ groupId: existingGroup.id })
        await chrome.tabs.remove(existingGroupTabs.map(tab => tab.id!))
      }
    }

    const groupTabsFromBookmark = await chrome.bookmarks.getChildren(groupFromBookmark.id)
    // TODO: reuse tabs when possible
    const groupTabIds = await Promise.all(
      groupTabsFromBookmark.map(async groupTabFromBookmark => {
        return (
          await chrome.tabs.create({ url: groupTabFromBookmark.url, index: nextTabIndex++ })
        ).id!
      }),
    )

    if (groupTabIds.length) {
      const groupId = await chrome.tabs.group({
        tabIds: groupTabIds as [number, ...number[]],
      })
      await chrome.tabGroups.update(groupId, { collapsed: false, title, color })
    }
  }
}

chrome.commands.onCommand.addListener(async function (command: string): Promise<void> {
  if (command === 'select-next-tab') {
    selectTab(1)
  } else if (command === 'select-previous-tab') {
    selectTab(-1)
  } else if (command === 'select-next-tab-group') {
    selectNextTabGroup()
  } else if (command === 'select-previous-tab-group') {
    selectPreviousTabGroup()
  } else if (command === 'bookmark-tab-groups') {
    bookmarkTabGroups()
  } else if (command === 'restore-tab-groups') {
    restoreTabGroups()
  }
})
