document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'https://asia-southeast2-personalsmz.cloudfunctions.net/ProjectSmZ/lokasi';
    
    const map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
    }).setView([-6.917464, 107.619125], 13); // Bandung

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> | <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.control.attribution({ position: 'bottomleft' }).addTo(map);

    const form = document.getElementById('lokasi-form');
    const lokasiIdInput = document.getElementById('lokasi-id');
    const namaInput = document.getElementById('nama');
    const kategoriInput = document.getElementById('kategori');
    const deskripsiInput = document.getElementById('deskripsi');
    const longitudeInput = document.getElementById('longitude');
    const latitudeInput = document.getElementById('latitude');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const lokasiList = document.getElementById('lokasi-list');
    const toggleBtn = document.getElementById('toggle-table');
    const moveBtn = document.getElementById('move-table');
    const tableWrap = document.getElementById('table-wrap');
    const sidebar = document.getElementById('sidebar');

    let markers = {};

    const fetchLokasi = async () => {
        try {
            const response = await fetch(apiUrl);
            const lokasis = await response.json() || [];
            
            lokasiList.innerHTML = '';
            Object.values(markers).forEach(marker => map.removeLayer(marker));
            markers = {};

            lokasis.forEach(lokasi => {
                addLokasiToList(lokasi);
                addMarkerToMap(lokasi);
            });
        } catch (error) {
            console.error('Gagal mengambil data:', error);
        }
    };

    const addLokasiToList = (lokasi) => {
        const tr = document.createElement('tr');
        tr.dataset.id = lokasi._id;
        tr.innerHTML = `
            <td class="td-nama">${lokasi.nama}</td>
            <td class="td-kategori">${lokasi.kategori}</td>
            <td class="td-aksi">
                <div class="action-buttons">
                    <button class="edit-btn" title="Edit"><i class="fa fa-pen" aria-hidden="true"></i></button>
                    <button class="delete-btn" title="Hapus"><i class="fa fa-trash" aria-hidden="true"></i></button>
                </div>
            </td>
        `;
        lokasiList.appendChild(tr);
    };

    const addMarkerToMap = (lokasi) => {
        const [longitude, latitude] = lokasi.koordinat.coordinates;
        const marker = L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup(`<b>${lokasi.nama}</b><br>${lokasi.deskripsi}`);
        
        markers[lokasi._id] = marker;
        try {
            const el = marker.getElement && marker.getElement();
            if (el) {
                el.classList.add('bounce');
                setTimeout(() => el.classList.remove('bounce'), 800);
            }
        } catch (e) {
        }
    };

    const resetForm = () => {
        form.reset();
        lokasiIdInput.value = '';
        submitBtn.innerHTML = '<i class="fa fa-plus-circle" aria-hidden="true"></i> Tambah Lokasi';
        cancelBtn.classList.add('hidden');
    };

    const fillFormForEdit = (lokasi) => {
        lokasiIdInput.value = lokasi._id;
        namaInput.value = lokasi.nama;
        kategoriInput.value = lokasi.kategori;
        deskripsiInput.value = lokasi.deskripsi;
        longitudeInput.value = lokasi.koordinat.coordinates[0];
        latitudeInput.value = lokasi.koordinat.coordinates[1];
        submitBtn.innerHTML = '<i class="fa fa-pen" aria-hidden="true"></i> Update Lokasi';
        cancelBtn.classList.remove('hidden');
    };

    map.on('click', (e) => {
        longitudeInput.value = e.latlng.lng.toFixed(6);
        latitudeInput.value = e.latlng.lat.toFixed(6);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = lokasiIdInput.value;
        const data = {
            nama: namaInput.value,
            kategori: kategoriInput.value,
            deskripsi: deskripsiInput.value,
            koordinat: {
                type: 'Point',
                coordinates: [
                    parseFloat(longitudeInput.value),
                    parseFloat(latitudeInput.value)
                ]
            }
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${apiUrl}?id=${id}` : apiUrl;

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Operasi gagal');
            resetForm();
            fetchLokasi();
            Swal.fire({ toast: true, position: 'top-end', html: '<i class="fa fa-circle-check" style="color:#28a745"></i>&nbsp;Sukses', showConfirmButton: false, timer: 1500 });
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyimpan data.' });
        }
    });

    lokasiList.addEventListener('click', async (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;
        const id = tr.dataset.id;

        if (e.target.classList.contains('delete-btn')) {
            const confirm = await Swal.fire({
                title: 'Hapus lokasi?',
                text: 'Lokasi akan dihapus secara permanen.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Hapus',
                cancelButtonText: 'Batal'
            });
                    if (confirm.isConfirmed) {
                try {
                    const response = await fetch(`${apiUrl}?id=${id}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Gagal menghapus');
                    fetchLokasi();
                    Swal.fire({ toast: true, position: 'top-end', html: '<i class="fa fa-trash" style="color:#e53935"></i>&nbsp;Terhapus', showConfirmButton: false, timer: 1200 });
                } catch (error) {
                    console.error('Error:', error);
                    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus lokasi.' });
                }
            }
        } else if (e.target.classList.contains('edit-btn')) {
            try {
                const response = await fetch(`${apiUrl}?id=${id}`);
                const lokasi = await response.json();
                fillFormForEdit(lokasi);
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengambil data lokasi.' });
            }
        } else {
            try {
                const response = await fetch(`${apiUrl}?id=${id}`);
                if (!response.ok) throw new Error('Gagal mengambil data');
                const lokasi = await response.json();

                const result = await Swal.fire({
                    title: lokasi.nama,
                    html: `<p><strong>Kategori:</strong> ${lokasi.kategori}</p><p>${lokasi.deskripsi || ''}</p>`,
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: 'Pan ke sini',
                    denyButtonText: 'Edit',
                    cancelButtonText: 'Tutup',
                    scrollbarPadding: false
                });

                if (result.isConfirmed) {
                    if (markers[id]) {
                        map.flyTo(markers[id].getLatLng(), 15);
                        markers[id].openPopup();
                        try {
                            const el = markers[id].getElement && markers[id].getElement();
                            if (el) {
                                el.classList.add('bounce');
                                setTimeout(() => el.classList.remove('bounce'), 700);
                            }
                        } catch (e) {}
                    }
                } else if (result.isDenied) {
                    fillFormForEdit(lokasi);
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengambil data lokasi.' });
            }
        }
    });

    cancelBtn.addEventListener('click', resetForm);

    toggleBtn.addEventListener('click', () => {
        const hidden = tableWrap.classList.toggle('hidden');
        toggleBtn.innerHTML = hidden ? '<i class="fa fa-eye" aria-hidden="true"></i> Tampilkan' : '<i class="fa fa-eye-slash" aria-hidden="true"></i> Sembunyikan';
        Swal.fire({ toast: true, position: 'top-end', html: hidden ? '<i class="fa fa-eye" style="color:#2196f3"></i>&nbsp;Daftar disembunyikan' : '<i class="fa fa-eye-slash" style="color:#28a745"></i>&nbsp;Daftar ditampilkan', showConfirmButton: false, timer: 1100 });
    });

    moveBtn.addEventListener('click', () => {
        const isLeft = sidebar.classList.toggle('left');
        moveBtn.innerHTML = isLeft ? '<i class="fa fa-arrows-left-right" aria-hidden="true"></i> Pindah Kanan' : '<i class="fa fa-arrows-left-right" aria-hidden="true"></i> Pindah Kiri';
        Swal.fire({ toast: true, position: 'top-end', html: '<i class="fa fa-arrows-left-right" style="color:#00b8d4"></i>&nbsp;' + (isLeft ? 'Sidebar di kiri' : 'Sidebar di kanan'), showConfirmButton: false, timer: 1100 });
    });

    fetchLokasi();
});
