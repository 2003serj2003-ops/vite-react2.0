import { useState } from 'react';
import UzumSalesReport from './reports/UzumSalesReport';
import UzumInventoryReport from './reports/UzumInventoryReport';
import UzumTopProductsReport from './reports/UzumTopProductsReport';
import UzumSimpleReport from './reports/UzumSimpleReport';
import { FiTrendingUp, FiPackage, FiAward, FiAlertTriangle, FiDollarSign, FiRotateCcw, FiCreditCard, FiBarChart2 } from 'react-icons/fi';

interface UzumReportsProps {
  lang: 'ru' | 'uz';
  token: string;
  onNavigateBack: () => void;
}

type ReportType = 'sales' | 'inventory' | 'top-products' | 'non-liquid' | 'paid-storage' | 'returned' | 'paid-out';

export default function UzumReports({ lang, token }: UzumReportsProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('sales');

  const T = {
    ru: {
      title: 'Отчеты',
      back: 'Назад',
      salesReport: 'Продажа и остатки',
      inventoryReport: 'Инвентаризация склада',
      topProducts: 'Топ продаваемые товары',
      nonLiquid: 'Неликвиды',
      paidStorage: 'Платное хранение',
      returned: 'Возвращенные товары',
      paidOut: 'Выплаченные товары',
      comingSoon: 'Скоро доступно',
    },
    uz: {
      title: 'Hisobotlar',
      back: 'Orqaga',
      salesReport: 'Sotish va qoldiqlar',
      inventoryReport: 'Ombor inventarizatsiyasi',
      topProducts: 'Eng ko\'p sotiladigan mahsulotlar',
      nonLiquid: 'Nolikvidlar',
      paidStorage: 'Pullik saqlash',
      returned: 'Qaytarilgan mahsulotlar',
      paidOut: 'To\'langan mahsulotlar',
      comingSoon: 'Tez orada',
    },
  };

  const t = T[lang];

  const reports = [
    { id: 'sales' as ReportType, icon: FiTrendingUp, label: t.salesReport, available: true, color: '#7c3aed' },
    { id: 'top-products' as ReportType, icon: FiAward, label: t.topProducts, available: true, color: '#22c55e' },
    { id: 'non-liquid' as ReportType, icon: FiAlertTriangle, label: t.nonLiquid, available: true, color: '#f59e0b' },
    { id: 'paid-storage' as ReportType, icon: FiDollarSign, label: t.paidStorage, available: true, color: '#3b82f6' },
    { id: 'returned' as ReportType, icon: FiRotateCcw, label: t.returned, available: true, color: '#ef4444' },
    { id: 'paid-out' as ReportType, icon: FiCreditCard, label: t.paidOut, available: true, color: '#8b5cf6' },
    { id: 'inventory' as ReportType, icon: FiPackage, label: t.inventoryReport, available: true, color: '#10b981' },
  ];

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 50%, #a855f7 100%)',
        padding: '24px 20px',
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FiBarChart2 size={32} />
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
            {t.title}
          </h1>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Reports Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 1024 
            ? 'repeat(4, 1fr)' 
            : window.innerWidth > 640 
              ? 'repeat(2, 1fr)' 
              : '1fr',
          gap: '16px',
          marginBottom: '20px',
        }}>
          {reports.map((report) => {
            const IconComponent = report.icon;
            const isActive = activeReport === report.id;
            
            return (
              <button
                key={report.id}
                onClick={() => report.available && setActiveReport(report.id)}
                disabled={!report.available}
                style={{
                  padding: '20px',
                  background: isActive 
                    ? `linear-gradient(135deg, ${report.color} 0%, ${report.color}dd 100%)` 
                    : 'white',
                  color: isActive ? 'white' : '#1f2937',
                  border: isActive ? 'none' : '2px solid #e5e7eb',
                  borderRadius: '16px',
                  cursor: report.available ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '600',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'all 0.2s',
                  boxShadow: isActive 
                    ? `0 8px 16px ${report.color}40` 
                    : '0 2px 8px rgba(0,0,0,0.06)',
                  opacity: report.available ? 1 : 0.5,
                  transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseOver={(e) => {
                  if (report.available && !isActive) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  }
                }}
              >
                {/* Icon */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{
                    padding: '12px',
                    background: isActive ? 'rgba(255,255,255,0.2)' : `${report.color}15`,
                    borderRadius: '12px',
                    display: 'inline-flex',
                  }}>
                    <IconComponent size={24} style={{ color: isActive ? 'white' : report.color }} />
                  </div>
                  {isActive && (
                    <div style={{
                      padding: '4px 10px',
                      background: 'rgba(255,255,255,0.25)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                    }}>
                      ACTIVE
                    </div>
                  )}
                </div>

                {/* Label */}
                <div style={{ lineHeight: '1.3' }}>
                  {report.label}
                  {!report.available && (
                    <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '6px' }}>
                      {t.comingSoon}
                    </div>
                  )}
                </div>

                {/* Decorative Element */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: '150px',
                    height: '150px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Report */}
        {/* Active Report */}
        {activeReport === 'sales' && (
          <UzumSalesReport lang={lang} token={token} />
        )}
        {activeReport === 'inventory' && (
          <UzumInventoryReport lang={lang} token={token} />
        )}
        {activeReport === 'top-products' && (
          <UzumTopProductsReport lang={lang} token={token} />
        )}
        {activeReport === 'non-liquid' && (
          <UzumSimpleReport lang={lang} token={token} type="non-liquid" />
        )}
        {activeReport === 'paid-storage' && (
          <UzumSimpleReport lang={lang} token={token} type="paid-storage" />
        )}
        {activeReport === 'returned' && (
          <UzumSimpleReport lang={lang} token={token} type="returned" />
        )}
        {activeReport === 'paid-out' && (
          <UzumSimpleReport lang={lang} token={token} type="paid-out" />
        )}
      </div>
    </div>
  );
}
