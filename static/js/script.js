document.addEventListener('DOMContentLoaded', function() {
    const map = L.map('mapid').setView([-8.0476, -34.8770], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    L.popup()
        .setLatLng(map.getCenter())
        .setContent(`<div style="text-align:center;">
            <h3>Como usar o mapa:</h3>
            <p><strong>Clique em qualquer lugar</strong> para marcar um local perigoso</p>
            <p><strong>Use a busca</strong> em cima do mapa para encontrar endereços</p>
        </div>`)
        .openOn(map);
    setTimeout(() => map.closePopup(), 16000);

    const markerColors = {
        'alto-risco': '#e74c3c',
        'cuidado': '#f39c12',
        'seguro': '#2ecc71'
    };

    const shelters = [
        { coords: [-8.0489691, -34.942389], title: 'Abrigo Casa de Isabel', description: 'Atende meninas e mulheres em situação de vulnerabilidade', link: 'https://maps.app.goo.gl/9ox4zGSZssBqBxpH8' },
        { coords: [-8.063549, -34.8904319], title: 'Abrigo Casa Menina Mulher', description: 'Atende meninas e mulheres em situação de vulnerabilidade', link: 'https://maps.app.goo.gl/ygHEDVzcBLiRYTtA9' },
        { coords: [-8.0924377, -34.9321112], title: 'SER- Centro de Referência Clarice Lispector', description: 'Atende meninas e mulheres em situação de vulnerabilidade', link: 'https://maps.app.goo.gl/G7CYsLGQ8zoAy1N48' },
        { coords: [-8.0246247, -34.9173637], title: 'Lar de maria', description: 'Atende meninas e mulheres em situação de vulnerabilidade', link: 'https://maps.app.goo.gl/G7CYsLGQ8zoAy1N48' }
    ];

    shelters.forEach(shelter => {
        L.marker(shelter.coords, {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="background:${markerColors.seguro}; width:24px; height:24px; border-radius:50%; border:3px solid white;"></div>`,
                iconSize: [24,24]
            })
        }).addTo(map).bindPopup(`<b>${shelter.title}</b><br>${shelter.description} <br> <a href="${shelter.link}" target="_blank">Link para o abrigo</a>,`);
    });

    function loadAllReports() {
        fetch("/api/reports")
            .then(res => res.json())
            .then(reports => {
                reports.forEach(r => {
                    createMarker(
                        r.lat, r.lng,
                        r.type, r.level,
                        r.description, r.address,
                        r.id
                    );
                });
            });
    }

    document.getElementById('search-btn')?.addEventListener('click', handleAddressSearch);
    map.on('click', handleMapClick);
    document.getElementById('emergency-btn')?.addEventListener('click', handleEmergency);
    document.getElementById('police-btn')?.addEventListener('click', handlePolice);
    document.getElementById('shelter-btn')?.addEventListener('click', handleShelter);

    addCustomStyles();
    initChatbot();
    loadAllReports();

    function handleAddressSearch() {
        const address = document.getElementById('address-input').value;
        if (!address) return;
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
            .then(r => r.json())
            .then(data => {
                if (data.length > 0) {
                    const { lat, lon } = data[0];
                    map.setView([lat, lon], 16);
                    map.closePopup();
                    createReportForm(lat, lon, address);
                } else alert("Endereço não encontrado!");
            })
            .catch(() => alert("Erro ao buscar endereço. Tente novamente."));
    }

    function handleMapClick(e) {
        createReportForm(e.latlng.lat, e.latlng.lng, null);
    }

    function createReportForm(lat, lng, address) {
        const form = document.createElement('form');
        form.innerHTML = `
            ${address ? `<h3>Reportar Perigo em:</h3><p><strong>${address}</strong></p>` : '<h3>Reportar Perigo</h3>'}
            <div class="form-group">
                <label>Tipo de Ocorrência:</label>
                <select class="occurrence-type">
                    <option value="Assédio">Assédio</option>
                    <option value="Roubo">Roubo</option>
                    <option value="Iluminação">Iluminação</option>
                    <option value="Abrigo">Abrigo</option>
                    <option value="Outro">Outro</option>
                </select>
            </div>
            <div class="form-group">
                <label>Nível de Risco:</label>
                <select class="danger-level">
                    <option value="alto-risco">Alto Risco</option>
                    <option value="cuidado">Cuidado</option>
                </select>
            </div>
            <div class="form-group">
                <label>Descrição:</label>
                <textarea class="danger-description" placeholder="Ex: Homem de camisa vermelha assediando mulheres"></textarea>
            </div>
            <button type="submit">Enviar</button>
        `;

        const popup = L.popup()
            .setLatLng([lat, lng])
            .setContent(form)
            .openOn(map);

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const type = form.querySelector('.occurrence-type').value;
            const level = form.querySelector('.danger-level').value;
            const desc = form.querySelector('.danger-description').value;

            fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lat, lng, type, level,
                    description: desc,
                    address: address || "Local clicado no mapa"
                })
            })
            .then(r => r.json())
            .then(data => {
                createMarker(lat, lng, type, level, desc, address || "Local clicado no mapa", data.id);
                map.closePopup();
            })
            .catch(err => console.error("Erro:", err));
        });
    }

    function createMarker(lat, lng, occurrenceType, dangerLevel, description, address, id) {
        const popupContent = document.createElement('div');
        popupContent.className = 'custom-popup';
        popupContent.innerHTML = `
            <h4 style="color:${markerColors[dangerLevel]}">${occurrenceType.toUpperCase()}</h4>
            <p><strong>Nível:</strong> ${dangerLevel.replace('-', ' ')}</p>
            <div class="popup-content">${description || 'Sem descrição adicional'}</div>
            <div class="popup-footer">${new Date().toLocaleString()}</div>
            <div style="margin-top:10px; display:flex; gap:5px;">
                <button class="delete-btn">Excluir</button>
                <button class="edit-btn">Editar</button>
                <button class="comment-btn">Comentar</button>
            </div>
            <div class="comments-container" style="margin-top:10px; max-height:100px; overflow-y:auto; border-top:1px solid #ccc; padding-top:5px;"></div>
        `;

        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="background:${markerColors[dangerLevel]}; width:24px; height:24px; border-radius:50%; border:3px solid white;"></div>`,
                iconSize: [24,24]
            })
        }).addTo(map).bindPopup(popupContent);

        function loadComments() {
            fetch(`/api/reports/${id}/comments`)
                .then(r => r.json())
                .then(comments => {
                    const ctn = popupContent.querySelector('.comments-container');
                    ctn.innerHTML = comments.map(c => `<p><strong>${c.author}:</strong> ${c.content}</p>`).join('');
                });
        }
        loadComments();

        popupContent.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm('Deseja realmente excluir este relatório?')) {
                fetch(`/api/reports/${id}`, { method: 'DELETE' })
                    .then(res => {
                        if (res.ok) map.removeLayer(marker);
                        else alert('Erro ao excluir.');
                    });
            }
        });

        popupContent.querySelector('.edit-btn').addEventListener('click', () => {
            const newType = prompt('Novo tipo de ocorrência:', occurrenceType);
            const newLevel = prompt('Novo nível de risco (alto-risco, cuidado):', dangerLevel);
            const newDesc = prompt('Nova descrição:', description);
            const newAddress = prompt('Novo endereço:', address);

            if (!newType || !newLevel) return;

            fetch(`/api/reports/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: newType,
                    level: newLevel,
                    description: newDesc,
                    address: newAddress
                })
            })
            .then(res => {
                if (res.ok) {
                    map.removeLayer(marker);
                    createMarker(lat, lng, newType, newLevel, newDesc, newAddress, id);
                } else alert('Erro ao editar.');
            });
        });

        popupContent.querySelector('.comment-btn').addEventListener('click', () => {
            const text = prompt('Digite seu comentário:');
            if (!text) return;
            fetch(`/api/reports/${id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author: 'Anônimo', content: text })
            })
            .then(res => {
                if (res.ok) loadComments();
                else alert('Erro ao comentar.');
            });
        });
    }

    function handleEmergency() {
        if (confirm('Você está em perigo? Podemos alertar seus contatos de confiança.')) {
            alert('Mensagem de emergência enviada para seus contatos com sua localização.');
        }
    }

    function handlePolice() {
        if (confirm('Ligar para a Polícia Militar (190)?')) {
            alert('Redirecionando para chamada de emergência...');
            window.location.href = 'tel:190';
        }
    }

    function handleShelter() {
        window.location.href = '/abrigos';
    }

    function addCustomStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .map-marker {
                position: absolute;
                width: 20px;
                height: 20px;
                background-color: #e74c3c;
                border-radius: 50%;
                border: 2px solid white;
                cursor: pointer;
                z-index: 10;
                animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            .custom-marker, .temp-marker {
                display: flex;
                justify-content: center;
                align-items: center;
            }
        `;
        document.head.appendChild(style);
    }

    function initChatbot() {
        const chatbotToggle = document.getElementById('chatbot-toggle');
        const chatbotContainer = document.getElementById('chatbot-container');
        const chatbotClose = document.getElementById('chatbot-close');
        const chatbotInput = document.getElementById('chatbot-input');
        const chatbotMessages = document.getElementById('chatbot-messages');
        
        const responses = {
            "denúncia": "Você pode denunciar de três formas:<br>1. <strong>Ligue 180</strong><br>2. <strong>Registre um BO online</strong><br>3. <strong>Procure uma DEAM</strong>",
            "abrigo": "Abrigos disponíveis:<br>Casa Abrigo Sigilosa, Casa da Mulher Pernambucana",
            "medida protetiva": "Para conseguir uma medida protetiva:<br>1. Registre um BO<br>2. Solicite ao delegado<br>3. Leve documentos",
            "default": "Digite: 'denúncia', 'abrigo' ou 'medida protetiva'"
        };

        chatbotToggle?.addEventListener('click', () => {
            chatbotContainer.style.display = chatbotContainer.style.display === 'flex' ? 'none' : 'flex';
            if (chatbotContainer.style.display === 'flex') {
                addBotMessage("Olá! Sou a assistente do Salve Maria. Como posso ajudar?");
            }
        });

        chatbotClose?.addEventListener('click', () => {
            chatbotContainer.style.display = 'none';
        });

        chatbotInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && chatbotInput.value.trim() !== '') {
                const userText = chatbotInput.value.toLowerCase();
                addUserMessage(userText);
                chatbotInput.value = '';
                setTimeout(() => {
                    let reply = responses.default;
                    if (userText.includes('denúncia') || userText.includes('denuncia')) reply = responses["denúncia"];
                    if (userText.includes('abrigo')) reply = responses["abrigo"];
                    if (userText.includes('medida')) reply = responses["medida protetiva"];
                    addBotMessage(reply);
                }, 500);
            }
        });

        function addUserMessage(text) {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'user-message';
            msgDiv.textContent = text;
            chatbotMessages.appendChild(msgDiv);
            scrollToBottom();
        }

        function addBotMessage(text) {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'bot-message';
            msgDiv.innerHTML = text;
            chatbotMessages.appendChild(msgDiv);
            scrollToBottom();
        }

        function scrollToBottom() {
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }
    }
});
