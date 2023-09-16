import './App.css';
import useWindowDimensions from './useWindowDimensions';
import { styled, Box, Container, Typography, Stack } from '@mui/material'
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';
import { Line } from "react-chartjs-2"
import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeSeriesScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeSeriesScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
);

const myGrey = '#616161'
const myActiveGreen = '#b6ffa8'

const BaseBox = styled(Box)({
  flexShrink: 0,
  borderRadius: 25,
  backgroundColor: 'white',
  position: 'relative',
})

const MediumBox = styled(BaseBox)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 700,
  color: myGrey,
})

const SmallBox = styled(BaseBox)({
  width: 40, height: 40,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 8,
  backgroundColor: 'white',
  WebkitTransition: 'background-color 200ms linear',
  msTransition: 'background-color 200ms linear',
  transition: 'background-color 200ms linear',
})

const RxTx = styled(Box)({
})

const NavBarItem = styled(Box)({
  width: 67, height: 67,
  borderRadius: 8,
  backgroundColor: '#f8faff',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
})

const NavBarItemActive = styled(NavBarItem)({
  boxShadow: '0px 1px 6px 0px rgba(194, 224, 255, 1), 0px 2px 30px 0px rgba(234, 237, 241, 0.3) inset',
  fontWeight: 700,
  color: '#5767e1',
  backgroundColor: 'white',
})

const LeftText = styled(Box)({
  fontSize: '1.2rem',
  fontWeight: 700,
  textAlign: 'right',
})

const RightAnswer = styled(Box)({
  fontSize: '1.8rem',
  fontWeight: 700,
  color: '#5767e1',
})

const UpfLeftText = styled(Box)({
  fontWeight: 600,
  textAlign: 'right',
})

const UpfRightAnswer = styled(Box)({
  fontWeight: 600,
})

const ChartTitle = styled(Box)({
  fontSize: '1.2rem',
  fontWeight: 700,
  marginBottom: 20,
  marginLeft: 15,
})


// Thin line parameters.

const lineWidth = 4

const HorizontalLine = styled(Box)({
  position: 'absolute',
  top: 50 / 2 - lineWidth / 2,
  left: 50,
  width: 400,
  height: lineWidth,
  backgroundColor: 'white',
  zIndex: -1
})

const VerticalLine = styled(Box)({
  position: 'absolute',
  top: 25,
  left: 150 / 2 - lineWidth / 2,
  width: lineWidth,
  height: 150,
  backgroundColor: 'white',
  zIndex: -1
})

const smoothArrowWidth = 26

const SmoothArrow = styled(Box)({
  position: 'absolute',
  backgroundColor: 'white',
  rotate: '45deg',
  width: smoothArrowWidth, height: smoothArrowWidth,
  borderRadius: 4,
  zIndex: -1,
})


// N3 N6 charts options (Chart.js).
const options = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      usePointStyle: true,
    },
  },
  scales: {
    x: {
      type: 'timeseries',
      time: {
        unit: 'second'
      },
      border: {
        display: false
      },
      ticks: {
        maxTicksLimit: 4,
        minRotation: 30,
      },
      grid: {
        display: false
      }
    },
    y: {
      border: {
        display: false
      },
      ticks: {
        maxTicksLimit: 4
      },
      grid: {
        // To show Y=0 axis.
        lineWidth: (context) => (context.tick.value === 0 ? 1 : 0)
      }
    }
  }
};

// Also charts options.
const constructGraphData = (labelTop, labelBottom, dataTop, dataBottom) => {
  return {
    datasets: [
      {
        label: labelTop,
        data: dataTop,
        borderColor: "black",
        pointStyle: false,
        borderWidth: 2,
        tension: 0.3,
        borderCapStyle: 'round',
      },
      {
        label: labelBottom,
        data: dataBottom,
        borderColor: "grey",
        pointStyle: false,
        borderWidth: 2,
        tension: 0.3,
        borderCapStyle: 'round',
      }
    ]
  }
}

// Empty chart initialization (Y=0 line with correct timestamps).
const getEmptyChartMeasurementsArray = () => {
  const currTime = Date.now()
  const arrayLength = 21
  return [...Array(arrayLength).keys()].map((i) => { return { x: currTime - i * updateTime, y: 0 } }).reverse()
}

// Better to change to 1 sec.
const updateTime = 2000

function App() {
  const apiPort = process.env.NODE_ENV === 'development' ? process.env.REACT_APP_DEV_API_PORT : window.env.API_PORT
  const { height, width } = useWindowDimensions();

  // Trackers to maintain responsive design.
  const enoughHeight = height >= 1000
  const enoughtWidth = width >= 1450

  // Better to use TypeScript to define such structs (received from api).
  const [config, setConfig] = useState()
  const [pfcpAssociations, setPfcpAssociations] = useState()
  const [xdpStats, setXdpStats] = useState({ prev: null, curr: null, changed: false })
  const [chartMeasurements, setChartMeasurements] = useState(getEmptyChartMeasurementsArray())

  const [time, setTime] = useState(Date.now())

  // Executes every <updateTime> milliseconds.
  useEffect(() => {
    fetch('http://localhost:' + apiPort + '/api/v1/config')
      .then(response => response.json())
      .then(json => setConfig(json))
      .catch(error => console.error(error));

    fetch('http://localhost:' + apiPort + '/api/v1/pfcp_associations/full')
      .then(response => response.json())
      .then(json => setPfcpAssociations(json))
      .catch(error => console.error(error));

    fetch('http://localhost:' + apiPort + '/api/v1/xdp_stats')
      .then(response => response.json())
      .then(json => {
        setXdpStats(
          {
            prev: xdpStats.curr,
            curr: json,
            changed: xdpStats.curr !== null && (json.pass - xdpStats.curr.pass) !== 0
          });
        setChartMeasurements(chartMeasurements.slice(1).concat(
          {
            x: Date.now(),
            y: xdpStats.curr ? json.pass - xdpStats.curr.pass : 0
          }))
      })
      .catch(error => console.error(error));
  }, [time])

  useEffect(() => {
    const interval = setInterval(() => setTime(Date), updateTime)
    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="">
      <Box sx={{ display: 'flex', fontFamily: 'Inter' }}>
        {/* Left navbar */}
        <Box sx={{ bgcolor: 'white', width: 100, height: height, mr: enoughtWidth ? '-100px' : '0px' }}>
          <Stack spacing={2} p={2}>
            <Typography fontFamily='Inter' fontWeight={900} py={1}>simsoul</Typography>
            <NavBarItemActive>stts</NavBarItemActive>
            <NavBarItem>dgnst</NavBarItem>
            <NavBarItem>trblsh</NavBarItem>
          </Stack>
        </Box>
        {/* Main container */}
        <Container sx={{
          display: 'flex', height: '92.3354vh',
          justifyContent: enoughHeight ? 'center' : 'start', 
          alignItems: 'center', flexDirection: 'column', mt: 3,
          mb: enoughHeight ? 0 : 8
        }}>
          <BaseBox sx={{ width: 230, height: 110, mb: 5, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
            <LeftText sx={{ mr: 1 }}>Connected<br />SMF-s</LeftText>
            <LeftText sx={{ mr: 3 }}>:</LeftText>
            <RightAnswer>{pfcpAssociations ? Object.keys(pfcpAssociations).length : ''}</RightAnswer>
            <SmoothArrow sx={{ left: 230 / 2 - smoothArrowWidth / 2, bottom: - smoothArrowWidth / 2 + 5 }} />
          </BaseBox>
          <MediumBox sx={{ width: 150, height: 50, mb: 6 }}>
            SMF-s
            <VerticalLine />
          </MediumBox>
          <Box sx={{ display: 'flex', flexDirection: 'row', mb: 2 }}>
            <SmallBox>N4</SmallBox>
            <Box sx={{ width: '67px', display: 'flex', justifyContent: 'center', alignItems: 'center', mr: '-67px' }}>
              <RxTx>?/?</RxTx>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            <MediumBox sx={{ width: 150, height: 50, mr: 4 }}>
              UE-s
              <HorizontalLine />
            </MediumBox>
            <MediumBox sx={{ width: 100, height: 50, mr: 4 }}>gNB-s</MediumBox>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SmallBox sx={{ mr: 2, backgroundColor: xdpStats.changed ? myActiveGreen : 'white' }}>N3</SmallBox>
            </Box>
            <MediumBox sx={{ width: 150, height: 50 }}>
              UPF
              <HorizontalLine />
            </MediumBox>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SmallBox sx={{ ml: 2, backgroundColor: xdpStats.changed ? myActiveGreen : 'white' }}>N6</SmallBox>
            </Box>
            <Box sx={{ width: 100, ml: 4 }}></Box>
            <Box sx={{ width: 150, ml: 4 }}>
              <MediumBox sx={{ width: 150, height: 50 }}>DN-s</MediumBox>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 19.3, mt: 0 }}>
            <Box sx={{ width: '67px', display: 'flex', justifyContent: 'center' }}>
              <RxTx>{xdpStats.changed ? xdpStats.curr.pass - xdpStats.prev.pass : '0'}/?</RxTx>
            </Box>
            <Box sx={{ width: '67px', display: 'flex', justifyContent: 'center' }}>
              <RxTx>{xdpStats.changed ? xdpStats.curr.pass - xdpStats.prev.pass : '0'}/?</RxTx>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', mt: 3 }}>
            <BaseBox sx={{ width: 230, height: 110, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
              <SmoothArrow sx={{ left: 230 / 2 - smoothArrowWidth / 2, top: - smoothArrowWidth / 2 + 5 }} />
              <LeftText sx={{ mr: 1 }}>Active PDU<br />sessions</LeftText>
              <LeftText sx={{ mr: 2 }}>:</LeftText>
              <RightAnswer>{
                pfcpAssociations
                  ? Object.keys(pfcpAssociations)
                    .map((a) => Object.keys(pfcpAssociations[a].Sessions).length)
                    .reduce((partialSum, nSessions) => partialSum + nSessions, 0)
                  : ''
              }</RightAnswer>
            </BaseBox>
            <BaseBox sx={{ width: 370, height: 210, ml: 70 + 'px', mr: 70 + 230 + 'px' }}>
              <SmoothArrow sx={{ left: 370 / 2 - smoothArrowWidth / 2, top: - smoothArrowWidth / 2 + 5 }} />
              <Box sx={{ width: '100%', color: '#acafb3', fontWeight: 700, mt: 3, display: 'flex', justifyContent: 'center' }}>UPF system info</Box>
              <Box sx={{
                mt: 2,
                display: 'grid',
                gap: 1,
                gridTemplateColumns: 'repeat(2, 1fr)',
              }}>
                <UpfLeftText gridColumn='span 1'>Api address:</UpfLeftText>
                <UpfRightAnswer gridColumn='span 1'>{config?.ApiAddress}</UpfRightAnswer>
                <UpfLeftText gridColumn='span 1'>PFCP address:</UpfLeftText>
                <UpfRightAnswer gridColumn='span 1'>{config?.PfcpAddress}</UpfRightAnswer>
                <UpfLeftText gridColumn='span 1'>PFCP node id:</UpfLeftText>
                <UpfRightAnswer gridColumn='span 1'>{config?.PfcpNodeId}</UpfRightAnswer>
                <UpfLeftText gridColumn='span 1'>Metrics address:</UpfLeftText>
                <UpfRightAnswer gridColumn='span 1'>{config?.MetricsAddress}</UpfRightAnswer>
              </Box>
              <Box sx={{ position: 'absolute', bottom: 0, right: 0, mr: 2.5, mb: 1.5 }}>more &gt;</Box>
            </BaseBox>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 40, mt: 10, mr: '15px' }}>
            <Stack sx={{ direction: 'column', alignItems: 'center' }}>
              <ChartTitle>N3</ChartTitle>
              <Box width={300} ><Line options={options}
                data={constructGraphData('N3 uplink', 'N3 downlink', chartMeasurements, chartMeasurements.map((item) => { return { x: item.x, y: 0 } }))} /></Box>
            </Stack>
            <Stack sx={{ direction: 'column', alignItems: 'center' }}>
              <ChartTitle>N6</ChartTitle>
              <Box width={300} ><Line options={options}
                data={constructGraphData('N6 uplink', 'N6 downlink', chartMeasurements, chartMeasurements.map((item) => { return { x: item.x, y: 0 } }))} /></Box>
            </Stack>
          </Box>
        </Container>
      </Box>
    </div>
  );
}

export default App;
