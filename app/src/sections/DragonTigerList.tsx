import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Trophy,
    TrendingUp,
    TrendingDown,
    Building2,
    X,
    RefreshCw,
    ChevronRight
} from 'lucide-react';
import {
    fetchDragonTigerList,
    fetchDragonTigerDetail,
    type DragonTigerItem,
    type DragonTigerInst
} from '@/services/stockService';

// 筛选类型
type FilterType = 'all' | 'net_buy' | 'net_sell';

// 格式化金额（元 -> 亿/万）
function formatAmount(value: number): string {
    if (Math.abs(value) >= 100000000) {
        return (value / 100000000).toFixed(2) + '亿';
    } else if (Math.abs(value) >= 10000) {
        return (value / 10000).toFixed(0) + '万';
    }
    return value.toFixed(0);
}

// 格式化日期 YYYYMMDD -> YYYY-MM-DD
function formatDate(dateStr: string): string {
    if (dateStr.length === 8) {
        return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
    return dateStr;
}

export function DragonTigerList() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<DragonTigerItem[]>([]);
    const [filter, setFilter] = useState<FilterType>('all');
    const [tradeDate, setTradeDate] = useState<string>('');

    // 详情弹窗状态
    const [selectedStock, setSelectedStock] = useState<DragonTigerItem | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailData, setDetailData] = useState<{ buyers: DragonTigerInst[]; sellers: DragonTigerInst[] }>({ buyers: [], sellers: [] });

    // 加载龙虎榜数据
    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const result = await fetchDragonTigerList({ filter, limit: 30 });
            setData(result);
            if (result.length > 0) {
                setTradeDate(result[0].trade_date);
            }
        } catch (error) {
            console.error('加载龙虎榜失败:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter]);

    // 加载机构明细
    const loadDetail = useCallback(async (item: DragonTigerItem) => {
        setSelectedStock(item);
        setDetailLoading(true);

        try {
            const result = await fetchDragonTigerDetail(item.ts_code, item.trade_date);
            setDetailData(result);
        } catch (error) {
            console.error('加载机构明细失败:', error);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // 统计数据
    const stats = {
        total: data.length,
        netBuy: data.filter(d => d.net_amount > 0).length,
        netSell: data.filter(d => d.net_amount < 0).length,
        totalNetBuy: data.filter(d => d.net_amount > 0).reduce((sum, d) => sum + d.net_amount, 0),
        totalNetSell: Math.abs(data.filter(d => d.net_amount < 0).reduce((sum, d) => sum + d.net_amount, 0))
    };

    return (
        <Card className="p-4 bg-white border-slate-200">
            {/* 标题栏 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-semibold text-slate-900">龙虎榜</h3>
                    {tradeDate && (
                        <span className="text-xs text-slate-500">{formatDate(tradeDate)}</span>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadData(true)}
                    disabled={refreshing}
                    className="gap-1"
                >
                    <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                    刷新
                </Button>
            </div>

            {/* 统计概览 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-2 rounded-lg bg-slate-50 text-center">
                    <div className="text-lg font-bold text-slate-900">{stats.total}</div>
                    <div className="text-xs text-slate-500">上榜股票</div>
                </div>
                <div className="p-2 rounded-lg bg-red-50 text-center">
                    <div className="text-lg font-bold text-red-600">{stats.netBuy}</div>
                    <div className="text-xs text-slate-500">净买入</div>
                </div>
                <div className="p-2 rounded-lg bg-green-50 text-center">
                    <div className="text-lg font-bold text-green-600">{stats.netSell}</div>
                    <div className="text-xs text-slate-500">净卖出</div>
                </div>
            </div>

            {/* 筛选按钮 */}
            <div className="flex gap-2 mb-4">
                <Badge
                    className={cn(
                        'cursor-pointer transition-colors',
                        filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    )}
                    onClick={() => setFilter('all')}
                >
                    全部
                </Badge>
                <Badge
                    className={cn(
                        'cursor-pointer transition-colors',
                        filter === 'net_buy' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'
                    )}
                    onClick={() => setFilter('net_buy')}
                >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    净买入
                </Badge>
                <Badge
                    className={cn(
                        'cursor-pointer transition-colors',
                        filter === 'net_sell' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
                    )}
                    onClick={() => setFilter('net_sell')}
                >
                    <TrendingDown className="w-3 h-3 mr-1" />
                    净卖出
                </Badge>
            </div>

            {/* 股票列表 */}
            <ScrollArea className="h-[400px]">
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-lg" />
                        ))}
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-slate-500">
                        暂无龙虎榜数据
                    </div>
                ) : (
                    <div className="space-y-2">
                        {data.map((item) => (
                            <div
                                key={`${item.ts_code}_${item.trade_date}`}
                                className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                                onClick={() => loadDetail(item)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-900">{item.name}</span>
                                        <span className="text-xs text-slate-500">{item.ts_code}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className={cn(
                                            'font-mono font-medium',
                                            item.pct_change >= 0 ? 'text-red-600' : 'text-green-600'
                                        )}>
                                            {item.pct_change >= 0 ? '+' : ''}{item.pct_change.toFixed(2)}%
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-500">
                                            净额: <span className={cn(
                                                'font-mono font-medium',
                                                item.net_amount >= 0 ? 'text-red-600' : 'text-green-600'
                                            )}>
                                                {item.net_amount >= 0 ? '+' : ''}{formatAmount(item.net_amount)}
                                            </span>
                                        </span>
                                        <span className="text-slate-500">
                                            买入: <span className="font-mono text-red-600">{formatAmount(item.l_buy)}</span>
                                        </span>
                                    </div>
                                    {item.reasons && item.reasons.length > 0 && (
                                        <div className="flex gap-1">
                                            {item.reasons.slice(0, 2).map((reason, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                                    {reason.length > 8 ? reason.slice(0, 8) + '...' : reason}
                                                </Badge>
                                            ))}
                                            {item.reasons.length > 2 && (
                                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                                    +{item.reasons.length - 2}
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* 机构明细弹窗 */}
            {selectedStock && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedStock(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 头部 */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                <div>
                                    <div className="font-semibold text-slate-900">{selectedStock.name}</div>
                                    <div className="text-sm text-slate-500">{selectedStock.ts_code} · {formatDate(selectedStock.trade_date)}</div>
                                </div>
                                <span className={cn(
                                    'font-mono font-medium',
                                    selectedStock.pct_change >= 0 ? 'text-red-600' : 'text-green-600'
                                )}>
                                    {selectedStock.pct_change >= 0 ? '+' : ''}{selectedStock.pct_change.toFixed(2)}%
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedStock(null)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* 上榜理由 */}
                        {selectedStock.reasons && selectedStock.reasons.length > 0 && (
                            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
                                <span className="text-sm text-amber-800">上榜理由: </span>
                                <div className="mt-1">
                                    {selectedStock.reasons.map((reason, idx) => (
                                        <div key={idx} className="text-sm text-amber-700">• {reason}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 机构明细内容 */}
                        <ScrollArea className="max-h-[calc(85vh-150px)]">
                            {detailLoading ? (
                                <div className="p-6 space-y-3">
                                    {[...Array(4)].map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    {/* 买方席位 */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <TrendingUp className="w-4 h-4 text-red-600" />
                                            <span className="font-medium text-red-600">买入前5</span>
                                        </div>
                                        {detailData.buyers.length === 0 ? (
                                            <div className="text-sm text-slate-500 text-center py-4">暂无数据</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {detailData.buyers.slice(0, 5).map((inst, idx) => (
                                                    <div key={idx} className="p-2 rounded-lg bg-red-50">
                                                        <div className="text-xs text-slate-600 truncate mb-1" title={inst.exalter}>
                                                            {inst.exalter}
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-red-600 font-mono">{formatAmount(inst.buy)}</span>
                                                            <span className="text-slate-500">{(inst.buy_rate * 100).toFixed(2)}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* 卖方席位 */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <TrendingDown className="w-4 h-4 text-green-600" />
                                            <span className="font-medium text-green-600">卖出前5</span>
                                        </div>
                                        {detailData.sellers.length === 0 ? (
                                            <div className="text-sm text-slate-500 text-center py-4">暂无数据</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {detailData.sellers.slice(0, 5).map((inst, idx) => (
                                                    <div key={idx} className="p-2 rounded-lg bg-green-50">
                                                        <div className="text-xs text-slate-600 truncate mb-1" title={inst.exalter}>
                                                            {inst.exalter}
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-green-600 font-mono">{formatAmount(inst.sell)}</span>
                                                            <span className="text-slate-500">{(inst.sell_rate * 100).toFixed(2)}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            )}
        </Card>
    );
}
