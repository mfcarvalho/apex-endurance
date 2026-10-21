// Mostrar uma falha de inicialização em vez de deixar os botões inoperantes.
import('./game.js?v=4').catch(error => {
  console.error('Falha ao iniciar APEX:', error);
  const panel = document.querySelector('#error');
  panel.textContent = 'Não foi possível iniciar o 3D. Verifique o suporte a WebGL 2 e recarregue a página.';
  panel.classList.remove('hidden');
  document.querySelector('#start').disabled = true;
  document.querySelector('#garage').disabled = true;
});
