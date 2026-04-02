import { useState } from 'react';

function WorkplaceDetailReport({ data }) {
  const [expandedWorkplaces, setExpandedWorkplaces] = useState(new Set());
  const [expandedServices, setExpandedServices] = useState(new Set());

  if (!data?.workplaces || data.workplaces.length === 0) {
    return (
      <div className="panel workplace-detail-panel">
        <div className="panel-heading">
          <h2>Детальный отчёт по рабочим местам</h2>
          <div className="text-medium">Нет данных</div>
        </div>
      </div>
    );
  }

  const toggleWorkplace = (workplaceName) => {
    const newSet = new Set(expandedWorkplaces);
    if (newSet.has(workplaceName)) {
      newSet.delete(workplaceName);
    } else {
      newSet.add(workplaceName);
    }
    setExpandedWorkplaces(newSet);
  };

  const toggleService = (serviceKey) => {
    const newSet = new Set(expandedServices);
    if (newSet.has(serviceKey)) {
      newSet.delete(serviceKey);
    } else {
      newSet.add(serviceKey);
    }
    setExpandedServices(newSet);
  };

  return (
    <div className="panel workplace-detail-panel" style={{ gridColumn: 'span 12' }}>
      <div className="panel-heading">
        <h2>Детальный отчёт по рабочим местам</h2>
        <div className="text-medium">{data.periodLabel || 'За период'}</div>
      </div>

      <div className="workplace-detail-list">
        {data.workplaces.map((workplace) => (
          <div key={workplace.workplaceName} className="workplace-item">
            <div 
              className="workplace-header"
              onClick={() => toggleWorkplace(workplace.workplaceName)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: '8px',
                marginBottom: '4px',
                cursor: 'pointer',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  transform: expandedWorkplaces.has(workplace.workplaceName) ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  fontSize: '12px',
                }}>▶</span>
                <strong style={{ fontSize: '14px', fontWeight: 600 }}>{workplace.workplaceName}</strong>
              </div>
              <span style={{ 
                backgroundColor: 'var(--blue-primary)', 
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500,
              }}>
                Итого: {Math.round(workplace.totalCompleted)}
              </span>
            </div>

            {expandedWorkplaces.has(workplace.workplaceName) && (
              <div className="services-list" style={{ marginLeft: '24px', marginBottom: '8px' }}>
                {workplace.services.map((service) => {
                  const serviceKey = `${workplace.workplaceName}-${service.serviceName}`;
                  return (
                    <div key={serviceKey} className="service-item" style={{ marginBottom: '4px' }}>
                      <div
                        className="service-header"
                        onClick={() => toggleService(serviceKey)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            transform: expandedServices.has(serviceKey) ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            fontSize: '10px',
                            color: 'var(--text-secondary)',
                          }}>▶</span>
                          <span style={{ fontSize: '13px' }}>{service.serviceName}</span>
                        </div>
                        <span style={{ 
                          backgroundColor: 'var(--blue-medium)', 
                          color: 'white',
                          padding: '3px 10px',
                          borderRadius: '10px',
                          fontSize: '11px',
                        }}>
                          {Math.round(service.totalCompleted)}
                        </span>
                      </div>

                      {expandedServices.has(serviceKey) && (
                        <div className="departments-list" style={{ marginLeft: '20px', marginTop: '4px' }}>
                          <table className="data-table" style={{ fontSize: '12px' }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Отделение</th>
                                <th style={{ textAlign: 'right', padding: '6px 10px', width: '80px' }}>Количество</th>
                              </tr>
                            </thead>
                            <tbody>
                              {service.departments.map((dept, index) => (
                                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--bg-surface)' }}>
                                  <td style={{ padding: '6px 10px' }}>
                                    {dept.departmentName}
                                    {dept.departmentGroup && dept.departmentGroup !== dept.departmentName && (
                                      <span style={{ 
                                        fontSize: '10px', 
                                        color: 'var(--text-secondary)',
                                        marginLeft: '6px',
                                      }}>
                                        ({dept.departmentGroup})
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'right', padding: '6px 10px', fontWeight: 500 }}>
                                    {Math.round(dept.completedCount)}
                                  </td>
                                </tr>
                              ))}
                              <tr style={{ fontWeight: 600, backgroundColor: 'var(--bg-elevated)' }}>
                                <td style={{ padding: '6px 10px' }}>Итого по услуге</td>
                                <td style={{ textAlign: 'right', padding: '6px 10px' }}>
                                  {Math.round(service.totalCompleted)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default WorkplaceDetailReport;
