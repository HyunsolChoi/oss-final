// src/components/utils/Map/Map.tsx
import React, { useState, useEffect } from 'react';
import './Map.css';

import type {
    Feature,
    FeatureCollection,
    Geometry,
    GeoJsonProperties
} from 'geojson';   // 타입만 가져오기

type GeoFeatureCollection = FeatureCollection<Geometry, GeoJsonProperties>;
type GeoFeature           = Feature<Geometry, GeoJsonProperties>;

interface Props {
    onRegionClick: (region: string) => void;
    selectedRegion?: string;
}

interface Region {
    name: string;
    id: string;
    path: string;
    color: string;
    center: { x: number; y: number };
}

// 지역별 색상 매핑을 상수로 분리
const REGION_COLORS: Record<string, string> = {
    '서울특별시': '#F59E0B',
    '경기도': '#84CC16',
    '인천광역시': '#06B6D4',
    '강원특별자치도': '#10B981',
    '충청북도': '#EF4444',
    '충청남도': '#F97316',
    '대전광역시': '#14B8A6',
    '세종특별자치시': '#A855F7',
    '전북특별자치도': '#3B82F6',
    '전라남도': '#F472B6',
    '광주광역시': '#C026D3',
    '경상북도': '#0EA5E9',
    '대구광역시': '#DC2626',
    '경상남도': '#FDE047',
    '부산광역시': '#7C3AED',
    '울산광역시': '#FB923C',
    '제주특별자치도': '#059669'
};

//호버하면 지역이름 맨 위로
function bringToFront(el: SVGGraphicsElement | null) {
    if (el && el.parentNode) {
        el.parentNode.appendChild(el);   // 부모의 마지막 자식 → 제일 위로
    }
}

function toFeatureCollection(
    data: GeoFeatureCollection | GeoFeature
): GeoFeatureCollection {
    return data.type === 'Feature'
        ? { type: 'FeatureCollection', features: [data] }
        : data;
}

const Map: React.FC<Props> = ({ onRegionClick, selectedRegion }) => {
    const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
    const [regions, setRegions] = useState<Region[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');

    // 안전한 숫자 검증 함수
    const isValidNumber = (value: any): value is number => {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    };

    useEffect(() => {
        const loadMapData = async () => {
            try {
                setIsLoading(true);
                setError('');

                // D3와 topojson-client 동적 import
                const [d3Module, topojsonModule] = await Promise.all([
                    import('d3'),
                    import('topojson-client')
                ]);

                //TopoJSON 로드 & GeoJSON 변환 ---------------------------------
                const topojsonData = await (await fetch('/data/korea-map-svg.json')).json();
                const objectKey    = Object.keys(topojsonData.objects)[0];
                const geoJsonRaw = topojsonModule.feature(
                    topojsonData,
                    topojsonData.objects[objectKey]
                ) as GeoFeatureCollection | GeoFeature;

                const geoJsonData = toFeatureCollection(geoJsonRaw);

                if (geoJsonData.features.length === 0) {
                    throw new Error('GeoJSON features가 비어있습니다');
                }

                // SVG 크기에 맞는 projection 생성
                const width  = 400;
                const height = 500;

                const projection = d3Module
                    .geoIdentity()
                    .reflectY(true)
                    .fitSize([width, height], geoJsonData);

                const pathGenerator = d3Module.geoPath().projection(projection);

                console.log(`${geoJsonData.features.length}개 지역 처리 시작...`);

                // 각 feature를 Region 객체로 변환
                const regionData: Region[] = geoJsonData.features
                    .map((feature: GeoFeature, index: number) => {
                        try {
                            // SVG path 생성
                            const pathString = pathGenerator(feature);

                            if (!pathString) {
                                console.warn(`지역 ${index}: SVG path 생성 실패`);
                                return null;
                            }

                            // 지역 중심점 계산
                            const bounds = pathGenerator.bounds(feature);

                            if (!bounds || bounds.length !== 2 ||
                                !Array.isArray(bounds[0]) || !Array.isArray(bounds[1])) {
                                console.warn(`지역 ${index}: bounds 계산 실패`);
                                return null;
                            }

                            const center = {
                                x: (bounds[0][0] + bounds[1][0]) / 2,
                                y: (bounds[0][1] + bounds[1][1]) / 2
                            };

                            if (!isValidNumber(center.x) || !isValidNumber(center.y)) {
                                console.warn(`지역 ${index}: center 좌표 계산 실패`);
                                return null;
                            }

                            // 지역명 추출
                            const props = feature.properties || {};
                            let regionName = props['CTP_KOR_NM'];
                            if (!regionName) {
                                regionName = `지역${index + 1}`;
                                console.warn(`지역 ${index}: 이름을 찾을 수 없어 기본명 사용`);
                            }

                            return {
                                name: regionName,
                                id: `region-${index}`,
                                path: pathString,
                                color: REGION_COLORS[regionName] || '#94A3B8',
                                center
                            };

                        } catch (err) {
                            console.error(`지역 ${index} 처리 중 오류:`, err);
                            return null;
                        }
                    })
                    .filter((region: Region | null): region is Region => region !== null);

                if (regionData.length === 0) {
                    throw new Error('처리된 지역 데이터가 없습니다');
                }

                console.log(`지역 데이터 처리 완료: ${regionData.length}개`);
                setRegions(regionData);

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
                console.error('TopojSON 로딩 실패:', errorMessage);
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        loadMapData();
    }, []);

    const handleRegionClick = (regionName: string) => {
        console.log('지역 클릭:', regionName);
        // 같은 지역을 다시 클릭하면 선택 해제
        if (selectedRegion === regionName) {
            onRegionClick('');
        } else {
            onRegionClick(regionName);
        }
    };

    const handleMouseEnter = (regionId: string) => {
        setHoveredRegion(regionId);
    };

    const handleMouseLeave = () => {
        setHoveredRegion(null);
    };

    const getDisplayName = (fullName: string): string => {
        const displayNameMap: Record<string, string> = {
            '강원특별자치도': '강원',
            '전북특별자치도': '전북',
            '제주특별자치도': '제주',
            '세종특별자치시': '세종'
        };

        return displayNameMap[fullName] ||
            fullName.replace(/특별시|광역시|특별자치시|특별자치도/g, '');
    };

    if (isLoading) {
        return (
            <div className="korea-map-container">
                <div className="loading-message">
                    <div className="spinner"></div>
                    지도 데이터를 불러오는 중...
                </div>
            </div>
        );
    }

    return (
        <div className="korea-map-container">
            <div className="map-header">
                {!hoveredRegion && (
                    <p>지역을 클릭하여 필터링하세요</p>
                )}
                {hoveredRegion && (
                    <p className="tooltip">
                        {regions.find(r => r.id === hoveredRegion)?.name}
                    </p>
                )}
            </div>

            {error && (
                <div className="error-message">
                    <span>{error}</span>
                </div>
            )}

            <svg
                viewBox="0 0 400 500"
                className="korea-map-svg"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* 배경 하고싶으면..width 조절*/}
                <rect width="0" height="500" fill="#f1f5f9" rx="8"/>

                {regions.map((region) => {
                    const isSelected = selectedRegion === region.name;
                    const isHovered = hoveredRegion === region.id;
                    const isFiltered = selectedRegion && !isSelected;

                    return (
                        <g
                            key={region.id}
                            onMouseEnter={(e) => {
                                handleMouseEnter(region.id);        // 기존 hover state
                                bringToFront(e.currentTarget);      // DOM 맨 뒤(=맨 위)로 이동
                            }}
                            onMouseLeave={handleMouseLeave}
                        >
                            <path
                                d={region.path}
                                className={`
                                    map-region
                                    ${isSelected ? 'selected' : ''}
                                    ${isHovered ? 'hovered' : ''}
                                    ${isFiltered ? 'filtered' : ''}
                                `}
                                fill={isSelected ? '#1e40af' : region.color}
                                stroke="#ffffff"
                                strokeWidth="2"
                                style={{
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    opacity: isFiltered ? 0.3 : 1,
                                    filter: isHovered ?
                                        'drop-shadow(3px 3px 6px rgba(0,0,0,0.3))' :
                                        isSelected ?
                                            'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))' :
                                            'drop-shadow(1px 1px 2px rgba(0,0,0,0.1))',
                                    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                                    transformOrigin: 'center'
                                }}
                                onClick={() => handleRegionClick(region.name)}
                                onMouseEnter={() => handleMouseEnter(region.id)}
                                onMouseLeave={handleMouseLeave}
                                data-region={region.name}
                            />

                            {/* 지역명 텍스트 */}
                            <text
                                x={region.center.x}
                                y={region.center.y}
                                className="region-label"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize={isSelected ? '10' : '9'}
                                fontWeight={isSelected ? '800' : '700'}
                                fill={isSelected ? '#ffffff' : '#1f2937'}
                                style={{
                                    /* ✨ HERE ------------- */
                                    opacity: isHovered || isSelected ? 1 : 0,
                                    transition: 'opacity .25s ease',
                                    /* 기존 속성 유지 */
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                }}
                            >
                                {getDisplayName(region.name)}
                            </text>
                        </g>
                    );
                })}
            </svg>


        </div>
    );
};

export default Map;