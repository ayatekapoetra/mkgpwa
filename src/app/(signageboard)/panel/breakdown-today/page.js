'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import moment from 'moment';
import { PresentionChart } from 'iconsax-react';
import ActiveDurationStackChart from 'views/signages/breakdown/ActiveDurationStackChart';
import { useGetBreakdownActiveDurationStack } from 'api/breakdown-charts';
import Typography from '@mui/material/Typography';

function BreakdownTodayPage() {
  const [clock, setClock] = useState(moment().format('HH:mm:ss'));
  const [tanggal, setTanggal] = useState(moment().format('dddd, DD MMMM YYYY'));
  const [isSlideshow, setIsSlideshow] = useState(false);

  const { data: stackDataHE, loading: stackLoadingHE, mutate: mutateHE } = useGetBreakdownActiveDurationStack();
  const { data: stackDataDT, loading: stackLoadingDT, mutate: mutateDT } = useGetBreakdownActiveDurationStack({ ctg: 'DT' });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(moment().format('HH:mm:ss'));
      setTanggal(moment().format('dddd, DD MMMM YYYY'));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleToggleSlideshow = () => {
    setIsSlideshow((prev) => !prev);
    setCurrentSlide(0);
    setRemainingSeconds(30);
  };

  const slides = useMemo(() => {
    const result = [];
    if (Array.isArray(stackDataHE?.labels)) {
      stackDataHE.labels.forEach((area) => {
        result.push({
          key: `he-${area}`,
          area,
          type: 'HE',
          title: `BREAKDOWN ALAT BERAT TERKINI AREA ${area}`,
          component: (
            <ActiveDurationStackChart
              data={stackDataHE}
              loading={stackLoadingHE}
              title={`BREAKDOWN ALAT BERAT TERKINI AREA ${area}`}
              subheader="Durasi ongoing per area dan equipment (hari)"
              areaFilter={area}
            />
          )
        });
      });
    }
    if (Array.isArray(stackDataDT?.labels)) {
      stackDataDT.labels.forEach((area) => {
        result.push({
          key: `dt-${area}`,
          area,
          type: 'DT',
          title: `BREAKDOWN DUMPTRUCK TERKINI AREA ${area}`,
          component: (
            <ActiveDurationStackChart
              data={stackDataDT}
              loading={stackLoadingDT}
              title={`BREAKDOWN DUMPTRUCK TERKINI AREA ${area}`}
              subheader="Durasi ongoing per area dan equipment (hari)"
              areaFilter={area}
            />
          )
        });
      });
    }
    return result;
  }, [stackDataHE, stackLoadingHE, stackDataDT, stackLoadingDT]);

  // Slideshow timer and refetch at second 29
  useEffect(() => {
    if (!isSlideshow || slides.length === 0) return undefined;

    setRemainingSeconds(30);

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = prev - 1;
        if (next === 29) {
          mutateHE?.();
          mutateDT?.();
        }
        if (next <= 0) {
          const nextIndex = slides.length > 0 ? (currentSlide + 1) % slides.length : 0;
          setCurrentSlide(nextIndex);
          return 30;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSlideshow, slides.length, currentSlide, mutateHE, mutateDT]);

  useEffect(() => {
    if (currentSlide >= slides.length) setCurrentSlide(0);
  }, [slides.length, currentSlide]);

  return (
    <Stack sx={{ height: '100vh', overflow: 'hidden' }}>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Stack>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Breakdown Today</h2>
          <Stack direction="row" spacing={2} sx={{ mt: 0.5, fontSize: '0.875rem', color: 'text.secondary' }}>
            <span>{tanggal}</span>
            <span>|</span>
            <span>{clock}</span>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <button
            onClick={handleToggleSlideshow}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: isSlideshow ? '#ef4444' : 'white',
              color: isSlideshow ? 'white' : 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            aria-label={isSlideshow ? 'Stop slideshow' : 'Start slideshow'}
            title={isSlideshow ? 'Stop slideshow' : 'Start slideshow'}
          >
            <PresentionChart size={18} variant="Bold" />
            {isSlideshow ? 'Stop' : 'Start'}
          </button>
        </Stack>
      </Stack>

      <Paper
        sx={{
          flex: 1,
          m: 1,
          mt: 0,
          backgroundColor: 'transparent',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflowY: 'auto',
          p: 1
        }}
      >
        {!isSlideshow ? (
          <>
            {Array.isArray(stackDataHE?.labels) && stackDataHE.labels.map((area) => (
              <Box key={`he-${area}`} sx={{ flex: 1, minHeight: 600 }}>
                <ActiveDurationStackChart
                  data={stackDataHE}
                  loading={stackLoadingHE}
                  title={`BREAKDOWN ALAT BERAT TERKINI AREA ${area}`}
                  subheader="Durasi ongoing per area dan equipment (hari)"
                  areaFilter={area}
                />
              </Box>
            ))}

            {Array.isArray(stackDataDT?.labels) && stackDataDT.labels.map((area) => (
              <Box key={`dt-${area}`} sx={{ flex: 1, minHeight: 600 }}>
                <ActiveDurationStackChart
                  data={stackDataDT}
                  loading={stackLoadingDT}
                  title={`BREAKDOWN DUMPTRUCK TERKINI AREA ${area}`}
                  subheader="Durasi ongoing per area dan equipment (hari)"
                  areaFilter={area}
                />
              </Box>
            ))}
          </>
        ) : (
          <Box sx={{ flex: 1, minHeight: 600, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {slides[currentSlide]?.title || 'Slideshow'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">Next in</Typography>
                <Typography variant="body1" fontWeight={700}>
                  {String(remainingSeconds).padStart(2, '0')}s
                </Typography>
              </Stack>
            </Stack>
            <Box sx={{ flex: 1, minHeight: 520 }}>
              {slides[currentSlide]?.component ? (
                React.cloneElement(slides[currentSlide].component, { showTitle: false })
              ) : (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body1" color="text.secondary">Tidak ada slide</Typography>
                </Box>
              )}
            </Box>
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
              {slides.map((s, idx) => (
                <Box
                  key={s.key}
                  onClick={() => { setCurrentSlide(idx); setRemainingSeconds(30); }}
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: idx === currentSlide ? '#3b82f6' : '#d1d5db',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Paper>
    </Stack>
  );
}

export default BreakdownTodayPage;
