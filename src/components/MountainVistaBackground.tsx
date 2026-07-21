import React, { useState, useMemo } from 'react';

// Runner SVG as data URI
const runnerSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath fill='%23000' d='M32 8c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4zm8 12l-3 8-5-2-4 12h-6l6-16 4 2 2-6c0 0 2-2 6-2zm-16 18l-6 10h6l4-8zm18 0l-2 8 4 8h6l-6-12z'/%3E%3C/svg%3E`;

// Data Configuration for Original
const layersData = [
  { className: 'layer-6', speed: '120s', size: '222px', zIndex: 1, image: '6' },
  { className: 'layer-5', speed: '95s',  size: '311px', zIndex: 1, image: '5' },
  { className: 'layer-4', speed: '75s',  size: '468px', zIndex: 1, image: '4' },
  { className: 'runner-1',  speed: '8s',  size: '60px',  zIndex: 2, image: 'runner', animation: 'parallax_runner', bottom: '100px', noRepeat: true },
  { className: 'runner-2',  speed: '12s',  size: '60px',  zIndex: 2, image: 'runner', animation: 'parallax_runner', bottom: '100px', noRepeat: true },
  { className: 'layer-3', speed: '55s',  size: '158px', zIndex: 3, image: '3' },
  { className: 'layer-2', speed: '30s',  size: '145px', zIndex: 4, image: '2' },
  { className: 'layer-1', speed: '20s',  size: '136px', zIndex: 5, image: '1' },
];

// Variant 1: Original Mountain Vista
const Variant1 = () => {
  const dynamicStyles = useMemo(() => {
    return layersData
      .map(layer => {
        const url = layer.image === 'runner' ? runnerSvg : `https://s3-us-west-2.amazonaws.com/s.cdpn.io/24650/${layer.image}.png`;
        return `
          .v1-${layer.className} {
            background-image: url(${url});
            animation-duration: ${layer.speed};
            background-size: auto ${layer.size};
            z-index: ${layer.zIndex};
            ${layer.animation ? `animation-name: ${layer.animation};` : ''}
            ${layer.bottom ? `bottom: ${layer.bottom};` : ''}
            ${layer.noRepeat ? 'background-repeat: no-repeat;' : ''}
          }
        `;
      })
      .join('\n');
  }, []);

  return (
    <div className="relative w-full h-full min-h-full overflow-hidden bg-gradient-to-b from-sky-300 via-sky-200 to-orange-100">
      <style>{`
        ${dynamicStyles}
        .v1-parallax-layer {
          position: absolute;
          width: 100%;
          height: 100%;
          background-repeat: repeat-x;
          background-position: 0 100%;
          animation-name: parallax_fg;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes parallax_fg {
          0% { background-position: 2765px 100%; }
          100% { background-position: 550px 100%; }
        }
        @keyframes parallax_runner {
          0% { background-position: -300px 100%; }
          100% { background-position: 2000px 100%; }
        }
      `}</style>
      {layersData.map(layer => (
        <div key={layer.className} className={`v1-parallax-layer v1-${layer.className}`} />
      ))}
    </div>
  );
};

// Variant 2: Faster Pace with Darker Sky
const Variant2 = () => {
  const fastLayersData = layersData.map(layer => ({
    ...layer,
    speed: `${parseInt(layer.speed) / 2}s`
  }));

  const dynamicStyles = useMemo(() => {
    return fastLayersData
      .map(layer => {
        const url = layer.image === 'runner' ? runnerSvg : `https://s3-us-west-2.amazonaws.com/s.cdpn.io/24650/${layer.image}.png`;
        return `
          .v2-${layer.className} {
            background-image: url(${url});
            animation-duration: ${layer.speed};
            background-size: auto ${layer.size};
            z-index: ${layer.zIndex};
            ${layer.animation ? `animation-name: ${layer.animation};` : ''}
            ${layer.bottom ? `bottom: ${layer.bottom};` : ''}
            ${layer.noRepeat ? 'background-repeat: no-repeat;' : ''}
          }
        `;
      })
      .join('\n');
  }, []);

  return (
    <div className="relative w-full h-full min-h-full overflow-hidden bg-gradient-to-b from-indigo-900 via-purple-700 to-pink-500">
      <style>{`
        ${dynamicStyles}
        .v2-parallax-layer {
          position: absolute;
          width: 100%;
          height: 100%;
          background-repeat: repeat-x;
          background-position: 0 100%;
          animation-name: parallax_fg;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes parallax_fg {
          0% { background-position: 2765px 100%; }
          100% { background-position: 550px 100%; }
        }
        @keyframes parallax_runner {
          0% { background-position: -300px 100%; }
          100% { background-position: 2000px 100%; }
        }
      `}</style>
      {fastLayersData.map(layer => (
        <div key={layer.className} className={`v2-parallax-layer v2-${layer.className}`} />
      ))}
    </div>
  );
};

// Variant 3: Reverse Direction
const Variant3 = () => {
  const dynamicStyles = useMemo(() => {
    return layersData
      .map(layer => {
        const url = layer.image === 'runner' ? runnerSvg : `https://s3-us-west-2.amazonaws.com/s.cdpn.io/24650/${layer.image}.png`;
        return `
          .v3-${layer.className} {
            background-image: url(${url});
            animation-duration: ${layer.speed};
            background-size: auto ${layer.size};
            z-index: ${layer.zIndex};
            ${layer.animation ? `animation-name: ${layer.animation === 'parallax_runner' ? 'v3_parallax_runner' : 'v3_parallax_fg'};` : 'animation-name: v3_parallax_fg;'}
            ${layer.bottom ? `bottom: ${layer.bottom};` : ''}
            ${layer.noRepeat ? 'background-repeat: no-repeat;' : ''}
          }
        `;
      })
      .join('\n');
  }, []);

  return (
    <div className="relative w-full h-full min-h-full overflow-hidden bg-gradient-to-b from-amber-200 via-orange-300 to-red-400">
      <style>{`
        ${dynamicStyles}
        .v3-parallax-layer {
          position: absolute;
          width: 100%;
          height: 100%;
          background-repeat: repeat-x;
          background-position: 0 100%;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes v3_parallax_fg {
          0% { background-position: 550px 100%; }
          100% { background-position: 2765px 100%; }
        }
        @keyframes v3_parallax_runner {
          0% { background-position: 2000px 100%; }
          100% { background-position: -300px 100%; }
        }
      `}</style>
      {layersData.map(layer => (
        <div key={layer.className} className={`v3-parallax-layer v3-${layer.className}`} />
      ))}
    </div>
  );
};

// Variant 4: Slow Motion with Muted Colors
const Variant4 = () => {
  const slowLayersData = layersData.map(layer => ({
    ...layer,
    speed: `${parseInt(layer.speed) * 3}s`
  }));

  const dynamicStyles = useMemo(() => {
    return slowLayersData
      .map(layer => {
        const url = layer.image === 'runner' ? runnerSvg : `https://s3-us-west-2.amazonaws.com/s.cdpn.io/24650/${layer.image}.png`;
        return `
          .v4-${layer.className} {
            background-image: url(${url});
            animation-duration: ${layer.speed};
            background-size: auto ${layer.size};
            z-index: ${layer.zIndex};
            opacity: 0.8;
            ${layer.animation ? `animation-name: ${layer.animation};` : ''}
            ${layer.bottom ? `bottom: ${layer.bottom};` : ''}
            ${layer.noRepeat ? 'background-repeat: no-repeat;' : ''}
          }
        `;
      })
      .join('\n');
  }, []);

  return (
    <div className="relative w-full h-full min-h-full overflow-hidden bg-gradient-to-b from-slate-400 via-slate-300 to-stone-200">
      <style>{`
        ${dynamicStyles}
        .v4-parallax-layer {
          position: absolute;
          width: 100%;
          height: 100%;
          background-repeat: repeat-x;
          background-position: 0 100%;
          animation-name: parallax_fg;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes parallax_fg {
          0% { background-position: 2765px 100%; }
          100% { background-position: 550px 100%; }
        }
        @keyframes parallax_runner {
          0% { background-position: -300px 100%; }
          100% { background-position: 2000px 100%; }
        }
      `}</style>
      {slowLayersData.map(layer => (
        <div key={layer.className} className={`v4-parallax-layer v4-${layer.className}`} />
      ))}
    </div>
  );
};

// Variant 5: Larger Scale with Vibrant Sunset
const Variant5 = () => {
  const largeLayersData = layersData.map(layer => ({
    ...layer,
    size: `${parseInt(layer.size) * 1.5}px`
  }));

  const dynamicStyles = useMemo(() => {
    return largeLayersData
      .map(layer => {
        const url = layer.image === 'runner' ? runnerSvg : `https://s3-us-west-2.amazonaws.com/s.cdpn.io/24650/${layer.image}.png`;
        return `
          .v5-${layer.className} {
            background-image: url(${url});
            animation-duration: ${layer.speed};
            background-size: auto ${layer.size};
            z-index: ${layer.zIndex};
            ${layer.animation ? `animation-name: ${layer.animation};` : ''}
            ${layer.bottom ? `bottom: ${layer.bottom};` : ''}
            ${layer.noRepeat ? 'background-repeat: no-repeat;' : ''}
          }
        `;
      })
      .join('\n');
  }, []);

  return (
    <div className="relative w-full h-full min-h-full overflow-hidden bg-gradient-to-b from-rose-500 via-orange-400 to-yellow-300">
      <style>{`
        ${dynamicStyles}
        .v5-parallax-layer {
          position: absolute;
          width: 100%;
          height: 100%;
          background-repeat: repeat-x;
          background-position: 0 100%;
          animation-name: parallax_fg;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes parallax_fg {
          0% { background-position: 2765px 100%; }
          100% { background-position: 550px 100%; }
        }
        @keyframes parallax_runner {
          0% { background-position: -300px 100%; }
          100% { background-position: 2000px 100%; }
        }
      `}</style>
      {largeLayersData.map(layer => (
        <div key={layer.className} className={`v5-parallax-layer v5-${layer.className}`} />
      ))}
    </div>
  );
};

interface MountainVistaBackgroundProps {
  variant?: number;
  opacity?: string;
}

const MountainVistaVariations = ({ variant = 1, opacity = "opacity-90" }: MountainVistaBackgroundProps) => {
  const variants = [
    { id: 1, component: Variant1 },
    { id: 2, component: Variant2 },
    { id: 3, component: Variant3 },
    { id: 4, component: Variant4 },
    { id: 5, component: Variant5 },
  ];

  const SelectedComponent = variants.find(v => v.id === variant)?.component || Variant1;

  return (
    <div className={`absolute inset-0 w-full h-full pointer-events-none ${opacity} z-0`}>
      <SelectedComponent />
    </div>
  );
};

export default MountainVistaVariations;
