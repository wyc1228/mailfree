/**
 * 邮箱列表模块（侧边栏）
 * @module modules/app/mailbox-list
 */

import { formatTs, escapeHtml, escapeAttr } from './ui-helpers.js';
import { getCurrentMailbox } from './mailbox-state.js';

// 分页状态
const MB_PAGE_SIZE = 10;
let mbPage = 1;
let mbLastCount = 0;
let mbSearchTerm = '';
let isLoading = false;

// 批量选择状态
let batchMode = false;
let selectedAddresses = new Set();

/**
 * 渲染邮箱列表项
 * @param {object} mailbox - 邮箱数据
 * @param {boolean} isActive - 是否选中
 * @returns {string}
 */
export function renderMailboxItem(mailbox, isActive = false) {
  const m = mailbox;
  const address = escapeAttr(m.address);
  const displayAddress = escapeHtml(m.address);
  const isPinned = m.is_pinned ? 'pinned' : '';
  const activeClass = isActive ? 'active' : '';
  const time = formatTs(m.created_at);
  const checked = selectedAddresses.has(m.address) ? 'checked' : '';
  
  if (batchMode) {
    return `
    <div class="mailbox-item ${isPinned} ${activeClass} batch-mode">
      <label class="batch-checkbox-label" onclick="event.stopPropagation()">
        <input type="checkbox" class="batch-checkbox" data-address="${address}" ${checked} onchange="toggleBatchSelect('${address}', this.checked)" />
      </label>
      <div class="mailbox-content" onclick="selectMailbox('${address}')">
        <span class="address">${displayAddress}</span>
        <span class="time">${time}</span>
      </div>
    </div>`;
  }
  
  return `
    <div class="mailbox-item ${isPinned} ${activeClass}" onclick="selectMailbox('${address}')">
      <div class="mailbox-content">
        <span class="address">${displayAddress}</span>
        <span class="time">${time}</span>
      </div>
      <div class="mailbox-actions">
        <button class="btn btn-ghost btn-sm pin" onclick="togglePin(event,'${address}')" title="${m.is_pinned ? '取消置顶' : '置顶'}">${m.is_pinned ? '📌' : '📍'}</button>
        <button class="btn btn-ghost btn-sm del" onclick="deleteMailbox(event,'${address}')" title="删除">🗑️</button>
      </div>
    </div>`;
}

/**
 * 渲染邮箱列表
 * @param {Array} mailboxes - 邮箱列表
 * @param {HTMLElement} container - 容器
 */
export function renderMailboxList(mailboxes, container) {
  if (!container) return;
  
  if (!mailboxes || mailboxes.length === 0) {
    container.innerHTML = '<div class="empty-state" style="text-align:center;color:#64748b;padding:20px">暂无邮箱</div>';
    return;
  }
  
  const currentMb = getCurrentMailbox();
  container.innerHTML = mailboxes.map(m => renderMailboxItem(m, m.address === currentMb)).join('');
}

/**
 * 渲染分页器
 * @param {object} elements - DOM 元素
 * @param {number} total - 总数
 */
export function renderMbPager(elements, total) {
  try {
    const totalPages = Math.max(1, Math.ceil(total / MB_PAGE_SIZE));
    if (!elements.mbPager) return;
    elements.mbPager.style.display = total > MB_PAGE_SIZE ? 'flex' : 'none';
    if (elements.mbPageInfo) elements.mbPageInfo.textContent = `${mbPage} / ${totalPages}`;
    if (elements.mbPrev) elements.mbPrev.disabled = mbPage <= 1;
    if (elements.mbNext) elements.mbNext.disabled = mbPage >= totalPages;
  } catch(_) {}
}

/**
 * 获取当前页码
 * @returns {number}
 */
export function getCurrentPage() {
  return mbPage;
}

/**
 * 设置页码
 * @param {number} page - 页码
 */
export function setCurrentPage(page) {
  mbPage = page;
}

/**
 * 获取页大小
 * @returns {number}
 */
export function getPageSize() {
  return MB_PAGE_SIZE;
}

/**
 * 上一页
 * @param {Function} loadFn - 加载函数
 */
export function prevMbPage(loadFn) {
  if (mbPage > 1) {
    mbPage -= 1;
    loadFn();
  }
}

/**
 * 下一页
 * @param {Function} loadFn - 加载函数
 * @param {number} total - 总数
 */
export function nextMbPage(loadFn, total) {
  const totalPages = Math.max(1, Math.ceil(total / MB_PAGE_SIZE));
  if (mbPage < totalPages) {
    mbPage += 1;
    loadFn();
  }
}

/**
 * 重置页码
 */
export function resetMbPage() {
  mbPage = 1;
  mbLastCount = 0;
}

/**
 * 设置搜索词
 * @param {string} term - 搜索词
 */
export function setSearchTerm(term) {
  mbSearchTerm = term;
}

/**
 * 获取搜索词
 * @returns {string}
 */
export function getSearchTerm() {
  return mbSearchTerm;
}

/**
 * 设置加载状态
 * @param {boolean} loading - 是否加载中
 */
export function setLoading(loading) {
  isLoading = loading;
}

/**
 * 获取加载状态
 * @returns {boolean}
 */
export function isLoadingMailboxes() {
  return isLoading;
}

/**
 * 设置最后计数
 * @param {number} count - 数量
 */
export function setLastCount(count) {
  mbLastCount = count;
}

/**
 * 获取最后计数
 * @returns {number}
 */
export function getLastCount() {
  return mbLastCount;
}

/**
 * 过滤搜索结果
 * @param {Array} mailboxes - 邮箱列表
 * @param {string} term - 搜索词
 * @returns {Array}
 */
export function filterBySearch(mailboxes, term) {
  if (!term || !term.trim()) return mailboxes;
  const lowerTerm = term.toLowerCase().trim();
  return mailboxes.filter(m => (m.address || '').toLowerCase().includes(lowerTerm));
}

// ====== 批量选择功能 ======

/**
 * 进入批量选择模式
 */
export function enterBatchMode() {
  batchMode = true;
  selectedAddresses.clear();
}

/**
 * 退出批量选择模式
 */
export function exitBatchMode() {
  batchMode = false;
  selectedAddresses.clear();
}

/**
 * 是否处于批量选择模式
 * @returns {boolean}
 */
export function isBatchMode() {
  return batchMode;
}

/**
 * 切换单个邮箱的选中状态
 * @param {string} address - 邮箱地址
 * @param {boolean} selected - 是否选中
 */
export function toggleBatchItem(address, selected) {
  if (selected) {
    selectedAddresses.add(address);
  } else {
    selectedAddresses.delete(address);
  }
}

/**
 * 全选当前页
 * @param {Array} mailboxes - 当前页邮箱列表
 */
export function selectAllOnPage(mailboxes) {
  for (const m of mailboxes) {
    selectedAddresses.add(m.address);
  }
}

/**
 * 取消全选当前页
 * @param {Array} mailboxes - 当前页邮箱列表
 */
export function deselectAllOnPage(mailboxes) {
  for (const m of mailboxes) {
    selectedAddresses.delete(m.address);
  }
}

/**
 * 获取已选中的邮箱地址列表
 * @returns {Array<string>}
 */
export function getSelectedAddresses() {
  return Array.from(selectedAddresses);
}

/**
 * 获取已选中数量
 * @returns {number}
 */
export function getSelectedCount() {
  return selectedAddresses.size;
}

export default {
  renderMailboxItem,
  renderMailboxList,
  renderMbPager,
  getCurrentPage,
  setCurrentPage,
  getPageSize,
  prevMbPage,
  nextMbPage,
  resetMbPage,
  setSearchTerm,
  getSearchTerm,
  setLoading,
  isLoadingMailboxes,
  setLastCount,
  getLastCount,
  filterBySearch,
  enterBatchMode,
  exitBatchMode,
  isBatchMode,
  toggleBatchItem,
  selectAllOnPage,
  deselectAllOnPage,
  getSelectedAddresses,
  getSelectedCount
};
