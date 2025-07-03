// Adicionar função construtora de timer precisa

function Timer(callback, timeInterval, options) {
  this.timeInterval = timeInterval;
  
  // Adicionar método para iniciar o timer
  this.start = () => {
    // Definir o tempo esperado. O momento em que iniciamos o timer mais o intervalo de tempo.
    this.expected = Date.now() + this.timeInterval;
    // Iniciar o timeout e salvar o id em uma propriedade, para que possamos cancelá-lo depois
    this.theTimeout = null;
    
    if (options.immediate) {
      callback();
    } 
    
    this.timeout = setTimeout(this.round, this.timeInterval);
    console.log('Timer Iniciado');
  }
  // Adicionar método para parar o timer
  this.stop = () => {

    clearTimeout(this.timeout);
    console.log('Timer Parado');
  }
  // Método round que cuida de rodar o callback e ajustar o tempo
  this.round = () => {
    console.log('timeout', this.timeout);
    // O desvio será o momento atual no tempo para esta rodada menos o tempo esperado.
    let drift = Date.now() - this.expected;
    // Rodar callback de erro se o desvio for maior que o intervalo de tempo, e se o callback de erro for fornecido
    if (drift > this.timeInterval) {
      // Se callback de erro for fornecido
      if (options.errorCallback) {
        options.errorCallback();
      }
    }
    callback();
    // Incrementar o tempo esperado pelo intervalo de tempo para cada rodada depois de rodar a função callback.
    this.expected += this.timeInterval;
    console.log('Desvio:', drift);
    console.log('Próximo intervalo de tempo para a rodada:', this.timeInterval - drift);
    // Rodar o timeout novamente e definir o intervalo de tempo da próxima iteração para o intervalo original menos o desvio.
    this.timeout = setTimeout(this.round, this.timeInterval - drift);
  }
}

export default Timer;