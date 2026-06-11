import {useEffect, useMemo, useState} from 'react';
import Particles, {initParticlesEngine} from "@tsparticles/react";
import {loadFull} from "tsparticles"
import "./Particles.css"

export default function ParticlesBackground({colour}){
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadFull(engine);
        }).then(() => setInit(true));
    }, []);

    const options = useMemo(() => ({
        background: { color: { value: "#38373d" } },
        particles: {
            number: { value: 80 },
            color: { value: `${colour}`},
            opacity: { value: 1 },
            size: { value: 2 },
            move: { enable: true, speed: 0.5 },
            links: {
                enable: true,
                    color: "#ffffff",
                    opacity: 0.1,
                    distance: 150
            }
        },
        interactivity: {
            events: {
                onHover: { enable: true, mode: "repulse" }
            }
        }
    }),[]);

    if (!init) return null;

    return <Particles id="tsparticles" options={options} />;

}