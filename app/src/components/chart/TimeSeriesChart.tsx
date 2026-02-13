import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import * as echarts from 'echarts';

interface TimeSeriesData {
    time: string;
    price: number;
    volume: number;
    avg_price: number;
}

interface TimeSeriesChartProps {
    data: TimeSeriesData[];
    preClose: number;
    className?: string;
    stockName?: string;
    stockCode?: string;
}

export function TimeSeriesChart({ data, preClose, className, stockName, stockCode }: TimeSeriesChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<echarts.ECharts | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return;

        const chart = echarts.init(chartContainerRef.current, null);
        chartRef.current = chart;

        const times = data.map(item => item.time);
        const prices = data.map(item => item.price);
        const avgPrices = data.map(item => item.avg_price);
        const volumes = data.map(item => item.volume);

        // ========== 东方财富风格：Y轴以昨收价对称 ==========
        const maxDev = Math.max(
            ...prices.map(p => Math.abs(p - preClose)),
            ...avgPrices.map(p => Math.abs(p - preClose)),
            preClose * 0.005 // 最小偏差 0.5%，避免价格不变时太扁
        );
        const yMin = preClose - maxDev * 1.1;
        const yMax = preClose + maxDev * 1.1;

        // 对称涨跌幅
        const maxChangePct = (maxDev / preClose) * 100 * 1.1;

        // 最新数据
        const latestPrice = prices[prices.length - 1];
        const latestChange = latestPrice - preClose;
        const latestChangePct = (latestChange / preClose * 100).toFixed(2);
        const latestVolume = volumes[volumes.length - 1];

        // 成交量颜色：当前价格 vs 前一分钟价格
        const volumeColors = volumes.map((_vol, idx) => {
            if (idx === 0) {
                return prices[idx] >= preClose ? 'rgba(220, 38, 38, 0.7)' : 'rgba(22, 163, 74, 0.7)';
            }
            return prices[idx] >= prices[idx - 1] ? 'rgba(220, 38, 38, 0.7)' : 'rgba(22, 163, 74, 0.7)';
        });

        const option: echarts.EChartsOption = {
            backgroundColor: 'transparent',
            // ========== 图表顶部信息（东方财富风格） ==========
            graphic: stockName ? [
                {
                    type: 'text',
                    left: 70,
                    top: 8,
                    style: {
                        text: `${stockName}${stockCode ? ` [${stockCode}]` : ''}`,
                        fill: '#64748b',
                        fontSize: 11,
                        fontFamily: 'system-ui, sans-serif'
                    }
                },
                {
                    type: 'text',
                    left: 250,
                    top: 8,
                    style: {
                        text: `价格:${latestPrice.toFixed(2)}  涨幅:${latestChange >= 0 ? '+' : ''}${latestChangePct}%  成交量:${latestVolume}`,
                        fill: latestChange >= 0 ? '#dc2626' : '#16a34a',
                        fontSize: 11,
                        fontFamily: 'system-ui, sans-serif'
                    }
                }
            ] : [],
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    crossStyle: {
                        color: '#94a3b8',
                        width: 1
                    },
                    lineStyle: {
                        color: '#94a3b8',
                        type: 'dashed'
                    },
                    label: {
                        show: true,
                        backgroundColor: '#475569'
                    }
                },
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                padding: [8, 12],
                textStyle: { color: '#334155', fontSize: 12 },
                formatter: (params: any) => {
                    if (!Array.isArray(params) || params.length === 0) return '';
                    const time = params[0].axisValue;
                    const today = new Date();
                    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    let html = `<div style="font-weight:600;margin-bottom:6px;color:#334155">${dateStr} ${time}</div>`;

                    params.forEach((item: any) => {
                        if (item.seriesName === '价格') {
                            const price = item.value;
                            const change = price - preClose;
                            const changePct = (change / preClose * 100).toFixed(2);
                            const color = change >= 0 ? '#dc2626' : '#16a34a';
                            html += `<div style="display:flex;justify-content:space-between;gap:20px;margin:2px 0">
                <span style="color:#64748b">价格</span>
                <span style="color:${color};font-weight:600;font-family:monospace">${price.toFixed(2)}</span>
              </div>`;
                            html += `<div style="display:flex;justify-content:space-between;gap:20px;margin:2px 0">
                <span style="color:#64748b">涨跌</span>
                <span style="color:${color};font-family:monospace">${change >= 0 ? '+' : ''}${change.toFixed(2)} (${change >= 0 ? '+' : ''}${changePct}%)</span>
              </div>`;
                        } else if (item.seriesName === '均价') {
                            html += `<div style="display:flex;justify-content:space-between;gap:20px;margin:2px 0">
                <span style="color:#64748b">均价</span>
                <span style="color:#d97706;font-family:monospace">${item.value.toFixed(2)}</span>
              </div>`;
                        } else if (item.seriesName === '成交量') {
                            const vol = item.value;
                            const volStr = vol >= 10000 ? (vol / 10000).toFixed(2) + '万' : vol.toString();
                            html += `<div style="display:flex;justify-content:space-between;gap:20px;margin:2px 0">
                <span style="color:#64748b">成交量</span>
                <span style="font-family:monospace">${volStr}</span>
              </div>`;
                        }
                    });
                    return html;
                }
            },
            grid: [
                {
                    left: 70,
                    right: 70,
                    top: stockName ? 30 : 15,
                    height: '55%'
                },
                {
                    left: 70,
                    right: 70,
                    top: '75%',
                    height: '18%'
                }
            ],
            xAxis: [
                {
                    type: 'category',
                    data: times,
                    boundaryGap: false,
                    axisLine: { lineStyle: { color: '#cbd5e1' } },
                    axisTick: { show: false },
                    axisLabel: {
                        color: '#64748b',
                        fontSize: 10,
                        fontFamily: 'monospace',
                        formatter: (value: string) => {
                            // 东方财富风格：只显示关键时间点
                            if (value === '09:30' || value === '10:30' || value === '11:30' ||
                                value === '13:00' || value === '14:00' || value === '15:00') {
                                // 特殊处理午休中间
                                if (value === '11:30') return '11:30/13:00';
                                if (value === '13:00') return '';
                                return value;
                            }
                            return '';
                        }
                    },
                    splitLine: {
                        show: true,
                        lineStyle: { color: '#e8ecf1', type: 'solid', width: 0.5 }
                    }
                },
                {
                    type: 'category',
                    gridIndex: 1,
                    data: times,
                    boundaryGap: false,
                    axisLine: { lineStyle: { color: '#cbd5e1' } },
                    axisTick: { show: false },
                    axisLabel: { show: false },
                    splitLine: { show: false }
                }
            ],
            yAxis: [
                {
                    // 左Y轴：价格（对称）
                    type: 'value',
                    min: yMin,
                    max: yMax,
                    position: 'left',
                    splitNumber: 6,
                    axisLine: { lineStyle: { color: '#cbd5e1' } },
                    axisTick: { show: false },
                    axisLabel: {
                        fontSize: 10,
                        fontFamily: 'monospace',
                        // 东方财富风格：高于昨收红色，低于昨收绿色
                        color: (value?: string | number) => {
                            const v = Number(value);
                            if (v > preClose + 0.001) return '#dc2626';
                            if (v < preClose - 0.001) return '#16a34a';
                            return '#64748b';
                        },
                        formatter: (value: number) => value.toFixed(2)
                    },
                    splitLine: {
                        lineStyle: { color: '#e8ecf1', type: 'solid', width: 0.5 }
                    }
                },
                {
                    // 右Y轴：涨跌幅（对称）
                    type: 'value',
                    min: -maxChangePct,
                    max: maxChangePct,
                    position: 'right',
                    splitNumber: 6,
                    axisLine: { lineStyle: { color: '#cbd5e1' } },
                    axisTick: { show: false },
                    axisLabel: {
                        fontSize: 10,
                        fontFamily: 'monospace',
                        // 东方财富风格：正值红色，负值绿色
                        color: (value?: string | number) => {
                            const v = Number(value);
                            if (v > 0.001) return '#dc2626';
                            if (v < -0.001) return '#16a34a';
                            return '#64748b';
                        },
                        formatter: (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
                    },
                    splitLine: { show: false }
                },
                {
                    // 成交量Y轴
                    type: 'value',
                    gridIndex: 1,
                    splitNumber: 2,
                    axisLine: { lineStyle: { color: '#cbd5e1' } },
                    axisTick: { show: false },
                    axisLabel: {
                        fontSize: 9,
                        fontFamily: 'monospace',
                        color: '#94a3b8',
                        formatter: (value: number) => {
                            if (value >= 10000) return (value / 10000).toFixed(1) + '万';
                            if (value >= 1000) return (value / 1000).toFixed(1) + '千';
                            return value.toString();
                        }
                    },
                    splitLine: {
                        show: true,
                        lineStyle: { color: '#f1f5f9', type: 'dashed', width: 0.5 }
                    }
                }
            ],
            series: [
                {
                    // 价格线
                    name: '价格',
                    type: 'line',
                    data: prices,
                    symbol: 'none',
                    lineStyle: {
                        width: 1.5,
                        color: '#1d4ed8'
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(59, 130, 246, 0.20)' },
                            { offset: 0.5, color: 'rgba(59, 130, 246, 0.08)' },
                            { offset: 1, color: 'rgba(59, 130, 246, 0.01)' }
                        ])
                    },
                    // 昨收基准线（东方财富风格：灰色实线，无文字）
                    markLine: {
                        silent: true,
                        symbol: 'none',
                        lineStyle: {
                            color: '#94a3b8',
                            type: 'solid',
                            width: 1
                        },
                        label: { show: false },
                        data: [
                            { yAxis: preClose }
                        ]
                    }
                },
                {
                    // 均价线（东方财富风格：黄色实线）
                    name: '均价',
                    type: 'line',
                    data: avgPrices,
                    symbol: 'none',
                    lineStyle: {
                        width: 1,
                        color: '#d97706',
                        type: 'solid'
                    }
                },
                {
                    // 成交量柱（前后价格对比着色）
                    name: '成交量',
                    type: 'bar',
                    xAxisIndex: 1,
                    yAxisIndex: 2,
                    data: volumes.map((vol, idx) => ({
                        value: vol,
                        itemStyle: {
                            color: volumeColors[idx]
                        }
                    })),
                    barWidth: '70%'
                }
            ]
        };

        chart.setOption(option);

        const handleResize = () => {
            chart.resize();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.dispose();
        };
    }, [data, preClose, stockName, stockCode]);

    return (
        <div className={cn('flex flex-col', className)}>
            <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                        <span className="w-4 h-0.5 bg-blue-700 rounded"></span>
                        <span className="text-slate-600">价格</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-4 h-0.5 bg-amber-600 rounded"></span>
                        <span className="text-slate-600">均价</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-4 h-[1px] bg-slate-400"></span>
                        <span className="text-slate-500">昨收</span>
                    </span>
                </div>
            </div>
            {data.length > 0 ? (
                <div
                    ref={chartContainerRef}
                    className="flex-1 min-h-[350px] rounded-lg border border-slate-200 bg-white"
                />
            ) : (
                <div className="flex-1 min-h-[350px] rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500">
                    暂无分时数据
                </div>
            )}
        </div>
    );
}
