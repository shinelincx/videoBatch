/**
 * 待发布任务队列
 * 基于任务ID去重，FIFO出列
 */
class TaskQueue {
  constructor() {
    this.queue = [];         // 任务数组
    this.taskIdSet = new Set(); // 任务ID集合（去重用）
  }

  /**
   * 批量入列，根据任务ID去重
   * @param {Array} tasks - 任务列表，每个任务需包含 id 字段
   * @returns {number} 实际新增的任务数量
   */
  enqueue(tasks) {
    let addedCount = 0;
    for (const task of tasks) {
      if (!task.id) {
        console.warn('  ⚠️ 任务缺少id字段，跳过:', JSON.stringify(task).substring(0, 100));
        continue;
      }
      if (this.taskIdSet.has(task.id)) {
        console.log(`  ⏭️ 任务 #${task.id} 已存在队列中，跳过`);
        continue;
      }
      this.queue.push(task);
      this.taskIdSet.add(task.id);
      addedCount++;
    }
    if (addedCount > 0) {
      console.log(`  📥 新增 ${addedCount} 个任务到队列 (总计: ${this.queue.length})`);
    }
    return addedCount;
  }

  /**
   * 取出队列头部任务
   * @returns {object|null} 任务对象或 null
   */
  dequeue() {
    if (this.queue.length === 0) return null;
    const task = this.queue.shift();
    // 保持 idSet 与 queue 同步（dequeue 后从 set 中移除）
    this.taskIdSet.delete(task.id);
    console.log(`  📤 取出任务 #${task.id} (剩余: ${this.queue.length})`);
    return task;
  }

  /** 队列是否为空 */
  isEmpty() {
    return this.queue.length === 0;
  }

  /** 获取队列长度 */
  size() {
    return this.queue.length;
  }

  /** 清空队列 */
  clear() {
    this.queue = [];
    this.taskIdSet.clear();
    console.log('  🗑️ 队列已清空');
  }
}

module.exports = TaskQueue;
