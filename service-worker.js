async function selectTab(offset) {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const activeIndex = tabs.findIndex(tab => tab.active)
  const nextIndex = (activeIndex + offset + tabs.length) % tabs.length
  if (activeIndex === -1) {
    return
  }

  const toActivate = tabs[nextIndex]
  if (toActivate) {
    chrome.tabs.update(toActivate.id, { active: true })
  }
}

async function selectNextTabGroup() {
  const tabs = await chrome.tabs.query({ currentWindow: true })
  const activeIndex = tabs.findIndex(tab => tab.active)
  const currentGroupId = tabs[activeIndex]?.groupId

  for (let i = (activeIndex + 1) % tabs.length; i != activeIndex; i = (i + 1) % tabs.length) {
    const tab = tabs[i]
    const groupId = tab?.groupId
    if (groupId !== undefined && groupId !== -1 && groupId !== currentGroupId) {
      chrome.tabs.update(tab.id, { active: true })
      break
    }
  }
}

async function selectPreviousTabGroup() {
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
        chrome.tabs.update(tabs[(j + 1) % tabs.length].id, { active: true })
        break
      }
    }
    break
  }
}

chrome.commands.onCommand.addListener(async function (command) {
  if (command === 'select-next-tab') {
    selectTab(1)
  } else if (command === 'select-previous-tab') {
    selectTab(-1)
  } else if (command === 'select-next-tab-group') {
    selectNextTabGroup()
  } else if (command === 'select-previous-tab-group') {
    selectPreviousTabGroup()
  }
})
