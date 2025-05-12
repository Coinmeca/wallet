import styled from "styled-components";

export const Style = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    max-height: 40vh;
    aspect-ratio: 1/1;
    filter: drop-shadow(0 0 8em rgba(var(--white), 0.3));

    & > img {
        position: relative;
        z-index: 2;
    }

    & > div {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        z-index: 1;
        aspect-ratio: 1/1;
    }

    & > div > * {
        background: rgb(var(--white));
        position: absolute;
        border-radius: 100%;
        mix-blend-mode: plus-lighter;

        &:nth-child(1) {
            width: 0.5%;
            height: 112.5%;
            filter: blur(1em);
            animation: rotate 2s infinite linear;
            opacity: 0.9;

            &:before {
                content: "";
                background: white;
                width: 100%;
                height: 100%;
            }
        }
        &:nth-child(2) {
            width: 10%;
            height: 100%;
            filter: blur(2em);
            animation: rotate2 3s infinite linear;
            opacity: 0.15;
        }
        &:nth-child(3) {
            width: 20%;
            height: 87.5%;
            filter: blur(3em);
            animation: rotate 4s infinite linear;
            opacity: 0.15;
        }
        &:nth-child(4) {
            width: 40%;
            height: 100%;
            filter: blur(4em);
            animation: rotate2 5s infinite linear;
            opacity: 0.15;
        }

        &:nth-child(5) {
            width: 0.5%;
            height: 112.5%;
            filter: blur(1em);
            animation: rotate 5s infinite linear;
            opacity: 0.9;

            &:before {
                content: "";
                background: white;
                width: 100%;
                height: 100%;
            }
        }
        &:nth-child(6) {
            width: 10%;
            height: 87.5%;
            filter: blur(2em);
            animation: rotate2 4s infinite linear;
            opacity: 0.15;
        }
        &:nth-child(7) {
            width: 20%;
            filter: blur(3em);
            animation: rotate 3s infinite linear;
            opacity: 0.15;
        }
        &:nth-child(8) {
            width: 40%;
            height: 100%;
            filter: blur(4em);
            animation: rotate2 2s infinite linear;
            opacity: 0.15;
        }
    }

    @keyframes rotate {
        0% {
            transform: rotate(0);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    @keyframes rotate2 {
        0% {
            transform: rotate(0);
        }
        100% {
            transform: rotate(-360deg);
        }
    }
`;
