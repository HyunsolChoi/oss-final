// Map.tsx
import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

// topojson 파일을 public 폴더에 두었다고 가정
const TOPO_JSON = '/data/korea-sido-topo.json';

// 시·도별 색상 팔레트 (요청에 맞춰 RGB / HEX)
const REGION_COLORS: Record<string, string> = {
  '서울특별시': '#fec44f',
  '경기도': '#82c91e',
  '인천광역시': '#00b8d9',
  '강원특별자치도': '#10b981',
  '충청북도': '#ef4444',
  '충청남도': '#fb923c',
  '대전광역시': '#14b8a6',
  '세종특별자치시': '#a855f7',
  '전북특별자치도': '#3b82f6',
  '전라남도': '#f472b6',
  '광주광역시': '#c026d3',
  '경상북도': '#0ea5e9',
  '대구광역시': '#dc2626',
  '경상남도': '#fde047',
  '부산광역시': '#7c3aed',
  '울산광역시': '#fb923c',
  '제주특별자치도': '#059669',
};

const Map = () => {
  // 지리 데이터를 한 번만 파싱
  const geographyConfig = useMemo(
    () => ({
      stroke: '#ffffff',
      strokeWidth: 1,
    }),
    [],
  );

  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{
        center: [128, 36],   // 대한민국 중심 경위도
        scale: 4500,         // 확대 비율 (값을 키우면 확대)
      }}
      width={420}
      height={650}
      style={{ width: '100%', height: 'auto' }}
    >
      <Geographies geography={TOPO_JSON}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const name = geo.properties.SIG_KOR_NM || geo.properties.name;
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                {...geographyConfig}
                fill={REGION_COLORS[name] || '#E5E7EB'}
                onMouseEnter={() => {
                  // hover 효과
                }}
                style={{
                  default: { outline: 'none' },
                  hover: { fill: '#6366f1', outline: 'none' },
                  pressed: { fill: '#6366f1', outline: 'none' },
                }}
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
};

export default Map;
