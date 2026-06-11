import type { Application, ApprovalRecord, HandoverRecord, DisposalType } from '@/types';

const disposalTypeMap: Record<DisposalType, string> = {
  scrap: '报废',
  transfer: '划转',
  auction: '拍卖',
};

const approvalActionMap: Record<string, string> = {
  approve: '通过',
  reject: '拒绝',
  return: '退回',
  transfer: '转办',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMoney(value: number): string {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function padEnd(str: string, length: number): string {
  const len = [...str].length;
  if (len >= length) return str;
  return str + ' '.repeat(length - len);
}

export function generateDisposalDoc(
  application: Application,
  approvalRecords: ApprovalRecord[],
  handoverRecord?: HandoverRecord
): string {
  const lines: string[] = [];
  const separator = '═'.repeat(60);
  const thinSeparator = '─'.repeat(60);

  lines.push('');
  lines.push(' '.repeat(22) + '资 产 处 置 单');
  lines.push('');
  lines.push(separator);
  lines.push('');

  lines.push('【基本信息】');
  lines.push('');
  lines.push(`  处置单号：${application.applicationNo}`);
  lines.push(`  申请日期：${formatDate(application.createdAt)}`);
  lines.push(`  处置方式：${disposalTypeMap[application.type] || application.type}`);
  lines.push('');
  lines.push(`  申请部门：${application.department}`);
  lines.push(`  申 请 人：${application.applicantName}`);
  lines.push('');

  lines.push(thinSeparator);
  lines.push('');

  lines.push('【处置原因】');
  lines.push('');
  const reasonLines = application.reason.match(/.{1,40}/g) || [application.reason];
  reasonLines.forEach((line) => {
    lines.push(`  ${line}`);
  });
  lines.push('');

  lines.push(thinSeparator);
  lines.push('');

  lines.push('【资产明细】');
  lines.push('');

  const colWidths = [14, 20, 12, 12, 8, 10];
  const headers = ['资产编号', '资产名称', '原值', '净值', '数量', '备注'];
  const headerLine = headers.map((h, i) => padEnd(h, colWidths[i])).join('');
  lines.push('  ' + headerLine);
  lines.push('  ' + '─'.repeat(colWidths.reduce((a, b) => a + b, 0)));

  application.items.forEach((item) => {
    const row = [
      item.assetNo,
      item.assetName.length > 18 ? item.assetName.slice(0, 17) + '…' : item.assetName,
      formatMoney(item.originalValue),
      formatMoney(item.netValue),
      item.quantity.toString(),
      item.remark || '-',
    ].map((cell, i) => padEnd(cell, colWidths[i])).join('');
    lines.push('  ' + row);
  });

  lines.push('');
  const totalOriginal = application.items.reduce((sum, item) => sum + item.originalValue * item.quantity, 0);
  const totalNet = application.items.reduce((sum, item) => sum + item.netValue * item.quantity, 0);
  const totalQty = application.items.reduce((sum, item) => sum + item.quantity, 0);
  lines.push(`  合计：共 ${totalQty} 件资产，原值合计 ${formatMoney(totalOriginal)}，净值合计 ${formatMoney(totalNet)}`);
  lines.push('');

  lines.push(thinSeparator);
  lines.push('');

  lines.push('【审批记录】');
  lines.push('');

  if (approvalRecords.length === 0) {
    lines.push('  暂无审批记录');
  } else {
    approvalRecords.forEach((record, index) => {
      lines.push(`  ${index + 1}. ${record.nodeName}`);
      lines.push(`     审批人：${record.approverName}`);
      lines.push(`     审批时间：${formatDate(record.createdAt)}`);
      lines.push(`     审批结果：${approvalActionMap[record.action] || record.action}`);
      if (record.comment) {
        const commentLines = record.comment.match(/.{1,38}/g) || [record.comment];
        lines.push(`     审批意见：${commentLines[0]}`);
        commentLines.slice(1).forEach((line) => {
          lines.push(`             ${line}`);
        });
      }
      lines.push('');
    });
  }

  lines.push(thinSeparator);
  lines.push('');

  lines.push('【实物交接信息】');
  lines.push('');

  if (handoverRecord) {
    lines.push(`  交接时间：${formatDate(handoverRecord.handoverDate)}`);
    lines.push(`  交 接 人：${handoverRecord.confirmerName}`);
    lines.push(`  接 收 人：${handoverRecord.receiverName}`);
    lines.push(`  接收部门：${handoverRecord.receiverDepartment}`);
    lines.push(`  资产数量：${handoverRecord.assetCount} 件`);
    if (handoverRecord.remark) {
      const remarkLines = handoverRecord.remark.match(/.{1,38}/g) || [handoverRecord.remark];
      lines.push(`  交接备注：${remarkLines[0]}`);
      remarkLines.slice(1).forEach((line) => {
        lines.push(`             ${line}`);
      });
    }
  } else {
    lines.push('  未交接');
  }
  lines.push('');

  lines.push(separator);
  lines.push('');
  lines.push(`  处置单生成时间：${formatDate(new Date().toISOString())}`);
  lines.push('');
  lines.push(' '.repeat(40) + '（本单由系统自动生成）');
  lines.push('');

  return lines.join('\n');
}
