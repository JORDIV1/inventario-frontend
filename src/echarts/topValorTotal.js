import * as echarts from "echarts";
import { productosService } from "../auth/productosService.js";

function formatAxisMoney(value) {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
  return value.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

export async function initTopValorChart() {
  const el = document.getElementById("chart-top-valor");
  const chart = echarts.init(el);
  chart.showLoading();

  try {
    const items = await productosService.TopValorTotal();

    if (!Array.isArray(items) || items.length === 0) {
      chart.hideLoading();
      chart.setOption({
        title: {
          text: "No hay datos suficientes",
          left: "center",
          top: "middle",
          textStyle: { fontSize: 14 },
        },
      });
      return;
    }

    const nombres = items.map((p) => p.nombre);

    const valores = items.map((p) => p.valorTotal / 100);

    const isMobile = window.innerWidth < 576;

    const option = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const p = params[0];
          const value = p.value.toLocaleString("es-CO", {
            maximumFractionDigits: 0,
          });
          return `${p.name}<br/>Valor total: $ ${value}`;
        },
      },
      grid: {
        left: "11%",
        right: "7%",
        bottom: isMobile ? "22%" : "14%",
        top: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: nombres,
        axisLabel: {
          rotate: isMobile ? 35 : 15,
          fontSize: isMobile ? 10 : 13,
          overflow: "truncate",
        },
        axisTick: { alignWithLabel: true },
        axisLine: {
          lineStyle: {
            color: "#ebe7e5ff",
          },
        },
      },
      yAxis: {
        type: "value",
        name: "Valor total ($)",
        splitNumber: isMobile ? 3 : 6,
        axisLine: { show: false },
        axisLabel: {
          fontSize: isMobile ? 10 : 13,
          formatter: (value) => formatAxisMoney(value),
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
            color: "#444a5577",
          },
        },
      },
      series: [
        {
          name: "Valor total",
          type: "bar",
          data: valores,
          barWidth: "55%",
          label: {
            show: !isMobile,
            position: "top",
            fontSize: 12,
            color: "#4b5563",
            formatter: (v) =>
              v.value.toLocaleString("es-CO", {
                maximumFractionDigits: 0,
              }),
          },
          itemStyle: {
            borderRadius: [10, 10, 4, 4],
          },
        },
      ],
      toolbox: {
        feature: {
          saveAsImage: { title: "Guardar como imagen" },
        },
        right: 10,
        top: 10,
      },
    };

    chart.hideLoading();
    chart.setOption(option);

    window.addEventListener("resize", () => chart.resize());
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
  } catch (err) {
    console.error("Error en top valor total:", err);
    chart.hideLoading();
    chart.setOption({
      title: {
        text: "Error al cargar datos",
        left: "center",
        top: "middle",
        textStyle: { fontSize: 14, color: "#b91c1c" },
      },
    });
  }
}
