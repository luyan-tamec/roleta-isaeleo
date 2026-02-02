 const dvd = document.getElementById("dvd");
        const checkbox = document.getElementById("toggleDVD");

        const imagens = [
           /* "img/foto1.png",
            "img/foto2.png",
            "img/foto3.png",
            "img/foto4.png",
            "img/foto5.png",*/
            "img/foto (1).png",
            "img/foto (2).png",
           /* "img/foto (3).png",
            "img/foto (4).png",
            "img/foto (5).png",
            "img/foto (6).png",
            "img/foto (7).png",
            "img/foto (8).png",
            "img/foto (9).png",
            "img/foto (10).png",
            "img/foto (11).png",
            "img/foto (12).png",
            "img/foto (13).png",
            "img/foto (14).png",
            "img/foto (15).png",
            "img/foto (16).png",
            "img/foto (17).png",
            "img/foto (18).png",
            "img/foto (19).png",
            "img/foto (20).png"*/
        ];

        let posX = 100;
        let posY = 100;
        let velX = 3;
        let velY = 3;
        let animando = false;
        let animationId;

        function trocarImagem() {
            const aleatoria = imagens[Math.floor(Math.random() * imagens.length)];
            dvd.style.backgroundImage = `url('${aleatoria}')`;
        }

        function animar() {
            if (!animando) return;

            const larguraTela = window.innerWidth;
            const alturaTela = window.innerHeight;
            const larguraBola = dvd.offsetWidth;
            const alturaBola = dvd.offsetHeight;

            let bateu = false;

            posX += velX;
            posY += velY;

            // colisão lateral
            if (posX + larguraBola >= larguraTela || posX <= 0) {
                velX *= -1;
                bateu = true;
            }

            // colisão vertical
            if (posY + alturaBola >= alturaTela || posY <= 0) {
                velY *= -1;
                bateu = true;
            }

            if (bateu) trocarImagem();

            dvd.style.left = posX + "px";
            dvd.style.top = posY + "px";

            animationId = requestAnimationFrame(animar);
        }

        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                animando = true;
                dvd.style.display = "block";
                trocarImagem(); // imagem inicial
                animar();
            } else {
                animando = false;
                dvd.style.display = "none";
                cancelAnimationFrame(animationId);
            }
        });