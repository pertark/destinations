import Image from 'next/image'
import { Inter, Raleway } from 'next/font/google'
import Head from 'next/head'
import { useEffect, useRef, useState } from 'react';
import { FaExpandArrowsAlt } from 'react-icons/fa';
import { GrClose } from 'react-icons/gr';
import { motion, AnimatePresence } from 'framer-motion';

import { GetStaticProps, InferGetStaticPropsType } from 'next';
import path from 'path';
import { promises as fs } from 'fs';

import type { Metadata } from 'next';


const mapboxgl = require("mapbox-gl/dist/mapbox-gl.js");

type Student = {
  name: string;
  school_id: number
}

type School = {
  id: number
  name: string;
  coords: [number, number]
}

const fadeIn = {
  opacity: 1,
  transition: {
    duration: 0.5
  }
}

const transparent = {
  opacity: 0,
}

const fadeOut = {
  opacity: 0,
  transition: {
    duration: 0.5
  }
}

const inter = Inter({ subsets: ['latin'] })
const raleway = Raleway({ subsets: ['latin'] })

export default function Home({ students, schools } : InferGetStaticPropsType<typeof getStaticProps>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [windowSize, setWindowSize] = useState<[number | undefined, number | undefined]>([undefined, undefined]);

  const map = useRef(null);
  const mapInstance = useRef<any>(null);
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    const handleResize = () => {
      setWindowSize([window.innerWidth, window.innerHeight]);
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [])

  useEffect(() => {
    console.log(windowSize)
    if (!(windowSize[0] && windowSize[1])) return; 

    const zoom = 0.00353*windowSize[0];
    console.log(zoom)
    if (mapInstance.current) return;
    mapInstance.current = new mapboxgl.Map({
      container: map.current,
      style: 'mapbox://styles/mapbox/light-v10',
      center: [-92.032, 39 + 2*(windowSize[1]/windowSize[0]-1)],
      zoom: 3.8*(0.65*(windowSize[0]/1500-1)+1),
      attributionControl: false,
      logoPosition: 'top-left'
    }).addControl(new mapboxgl.AttributionControl({
      // compact: true,
      
    }), 'bottom-left');

    for (const school of schools) {
      if (school.coords === null) continue;
      let studentList = students.filter((s) => s.school_id === school.id).map((s) => `<li>${s.name}</li>`).join('')
      let marker = new mapboxgl.Marker({ color: 'black' })
        .setLngLat(school.coords)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<b>${school.name}</b><ul>${studentList}</ul>`))
        .addTo(mapInstance.current);

      marker.getElement().addEventListener('click', () => {
        flyTo(school.coords);
      })
    }

  }, [windowSize])

  function flyTo(LngLat: [number, number]) {
    if (!mapInstance.current) return;
    setMenuOpen(false);
    mapInstance.current.flyTo({
      center: LngLat,
      zoom: 13,
      essential: true
    })
  }

  function flyToReset() {
    if (!mapInstance.current) return;
    setMenuOpen(false);
    mapInstance.current.flyTo({
      center: [-92.032, 38],
      zoom: 3.8,
      essential: true
    })
  }

  const menuContent = 
        <>
          {
            schools.slice(1).map((school, i) => {
              let _students = students.filter(student => student.school_id === school.id)
              return (
                <div className='flex flex-col p-1 pl-4 justify-center' key={i}>
                  <h2 className='font-bold text-lg md:max-w-[10em] cursor-pointer underline' onClick={() => flyTo(school.coords)}>{ school.name }</h2>
                  { _students.map((student, j) => <p className=' pl-3'>{ student.name }</p> )}
                </div>
              )
            })
          }
          <div className='flex flex-col p-1 pl-4' key={-1}>
            <h2 className='font-bold text-lg max-w-[10em]'>Gap Year</h2>
            { students.filter(student => student.school_id === 0).map((student, j) => <p className=' pl-3'>{ student.name }</p> )}
          </div>

          <br />
        </>

  return (
    <main
      className={`flex min-h-screen flex-col md:p-24 p-0 ${inter.className}`}
    >
      <Head>
        <title>Blair Magnet Class of '23 Destinations</title>
        {/* <link
          href="https://api.mapbox.com/mapbox-gl-js/v1.12.0/mapbox-gl.css"
          rel="stylesheet"
        /> */}
        <meta name="description" content="A map of where the Blair Magnet Class of 2023 is going to college!!" />
        <meta property="og:title" content="Blair Magnet '23 Destinations" />
      </Head>
      <div className="md:absolute block left-0 top-0 w-full md:h-full h-[40vh]" ref={map} />
      <h1 className={`text-4xl font-bold z-0 absolute md:block m-8 md:m-0`}>Blair Magnet Class of '23 Destinations</h1>

      {/* <motion.div className={`absolute bottom-0 right-0 py-4 ` 
          + (menuOpen ? `h-screen w-full overflow-y-auto bg-white` 
                      : `h-full w-60 overflow-y-scroll bg-menu`)} layout="position">
        <div className={`${raleway.className} flex ${menuOpen ? 'flex-wrap h-[95vh] flex-col pt-[5vh]' : 'flex-col'}`}>
          { 
            menuContent
          }
        </div>
      </motion.div> */}

      <AnimatePresence>
        {
          menuOpen ?
          <motion.div className="absolute bottom-0 right-0 py-4 h-screen w-full overflow-auto bg-white" key="fullscreen"
            // initial={transparent}
            // animate={fadeIn}
            // exit={fadeOut}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={`${raleway.className} flex flex-wrap h-[95vh] flex-col pt-[5vh]`}>
              { 
                menuContent
              }
            </div>
          </motion.div>
          :
          <motion.div className="md:absolute block md:bottom-0 right-0 py-4 md:h-full md:w-60 md:overflow-y-scroll w-full bg-menu" key="sidebar"
            // initial={transparent}
            // animate={fadeIn}
            // exit={fadeOut}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={`${raleway.className} flex flex-col`}>
              { 
                menuContent
              }
            </div>
          </motion.div>

        }
      </AnimatePresence>

      {
        menuOpen ? 
        <div className="absolute md:flex hidden right-0 top-2 aspect-square w-12 bg-menu rounded-l-lg items-center justify-center" key="menu-open">
          <GrClose className="text-2xl text-black cursor-pointer" onClick={() => setMenuOpen(false)}/>
        </div>
        :
        <>
        <div className="absolute right-60 top-2 aspect-square w-12 bg-menu rounded-l-lg md:flex hidden items-center justify-center" key="menu-close">
          <FaExpandArrowsAlt className="text-2xl text-black cursor-pointer" onClick={() => setMenuOpen(true)}/>
        </div>
        <p className='absolute bottom-0 right-60 mr-2 text-red-400 cursor-pointer hidden md:block' onClick={flyToReset}>reset</p>
        </>
      }


    </main>
  )
}

export const getStaticProps: GetStaticProps<{ students: Student[], schools: School[] }> = async () => {
  const students = await fs.readFile(path.join(process.cwd(), 'data', 'students.json'), 'utf-8');
  const schools = await fs.readFile(path.join(process.cwd(), 'data', 'schools.json'), 'utf-8');

  return {
    props: {
      students: JSON.parse(students),
      schools: JSON.parse(schools)
    }
  }
}

export const metadata: Metadata = {
  title: 'Blair Magnet Class of \'23 Destinations',
  description: 'A map of where the Blair Magnet Class of 2023 is going to college!!',
}