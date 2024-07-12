<div class="blob-loader"></div>

<style>
    .blob-loader {
        --block: no-repeat linear-gradient(oklch(var(--n)) 0 0);
        background: var(--block), var(--block), var(--block), var(--block), var(--block), var(--block), var(--block),
            var(--block), var(--block);

        background-size: 1rem 1rem;
        width: 2.5rem;
        height: 2.5rem;

        animation:
            expand 1s infinite,
            rotate 1s infinite;
    }

    @keyframes expand {
        0%,
        100% {
            width: 2.5rem;
            height: 2.5rem;
        }
        35%,
        65% {
            width: 4rem;
            height: 4rem;
        }
    }

    @keyframes rotate {
        0%,
        40% {
            background-position:
                0 0,
                0 50%,
                0 100%,
                50% 100%,
                100% 100%,
                100% 50%,
                100% 0,
                50% 0,
                50% 50%;
        }
        60%,
        100% {
            background-position:
                0 50%,
                0 100%,
                50% 100%,
                100% 100%,
                100% 50%,
                100% 0,
                50% 0,
                0 0,
                50% 50%;
        }
    }
</style>
