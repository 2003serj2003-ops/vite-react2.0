import { useState } from 'react';
import UzumSalesReport from './reports/UzumSalesReport';
import UzumInventoryReport from './reports/UzumInventoryReport';
import UzumTopProductsReport from './reports/UzumTopProductsReport';
import UzumSimpleReport from './reports/UzumSimpleReport';

interface UzumReportsProps {
  lang: 'ru' | 'uz';
  token: string;
  onNavigateBack: () => void;
}

type ReportType = 'sales' | 'inventory' | 'top-products' | 'non-liquid' | 'paid-storage' | 'returned' | 'paid-out';

export default function UzumReports({ lang, token, onNavigateBack }: UzumReportsProps) {
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
    { id: 'sales' as ReportType, icon: '📊', label: t.salesReport, available: true },
    { id: 'top-products' as ReportType, icon: '🏆', label: t.topProducts, available: true },
    { id: 'non-liquid' as ReportType, icon: '⚠️', label: t.nonLiquid, available: true },
    { id: 'paid-storage' as ReportType, icon: '💰', label: t.paidStorage, available: true },
    { id: 'returned' as ReportType, icon: '↩️', label: t.returned, available: true },
    { id: 'paid-out' as ReportType, icon: '💵', label: t.paidOut, available: true },
    { id: 'inventory' as ReportType, icon: '📦', label: t.inventoryReport, available: true },
  ];

  return (
    <div className="list" style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header with Navigation */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
        }}>
          <button
            onClick={onNavigateBack}
            style={{
              padding: '10px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ←
          </button>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: 0,
          }}>
            📈 {t.title}
          </h1>
        </div>

        {/* Reports Menu */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px',
        }}>
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => report.available && setActiveReport(report.id)}
              disabled={!report.available}
              style={{
                padding: '16px',
                backgroundColor: activeReport === report.id ? '#22c55e' : report.available ? 'white' : '#f9fafb',
                color: activeReport === report.id ? 'white' : report.available ? '#111827' : '#9ca3af',
                border: activeReport === report.id ? 'none' : '2px solid #e5e7eb',
                borderRadius: '12px',
                cursor: report.available ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '600',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                boxShadow: activeReport === report.id ? '0 4px 8px rgba(34, 197, 94, 0.3)' : 'none',
                opacity: report.available ? 1 : 0.6,
              }}
            >
              <span style={{ fontSize: '20px' }}>{report.icon}</span>
              <div style={{ flex: 1 }}>
                <div>{report.label}</div>
                {!report.available && (
                  <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>
                    {t.comingSoon}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Report */}
      <div>
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
