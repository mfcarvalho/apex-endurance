// Referência temporal apenas da corrida atual. Não usa DOM ou persistência.
// A curva da melhor volta fica privada para não copiar centenas de pontos por frame.
export class LapTiming {
  #length;
  #spacing;
  #current=[];
  #reference=null;
  #best=Infinity;

  constructor(length, spacing=2) {
    this.#length=length;
    this.#spacing=spacing;
  }

  get best() {return this.#best;}

  update(distance, time, valid=true) {
    if (!valid || distance<0 || distance>this.#length) return null;
    if (!this.#current.length) this.#current.push({distance:0,time});
    const last=this.#current.at(-1);
    if (distance-last.distance>=this.#spacing) this.#current.push({distance,time});
    const reference=this.#referenceTime(distance);
    return reference===null ? null : time-reference;
  }

  complete(time, valid=true) {
    if (valid) {
      const last=this.#current.at(-1);
      if(last?.distance===this.#length)last.time=time;
      else this.#current.push({distance:this.#length,time});
      if (time<this.#best) {
        this.#best=time;
        this.#reference=this.#current;
      }
    }
    // Descartar uma volta inválida também reinicia a amostragem da próxima.
    this.#current=[{distance:0,time:0}];
  }

  #referenceTime(distance) {
    const points=this.#reference;
    if (!points || points.length<2) return null;
    let low=0, high=points.length-1;
    while (high-low>1) {
      const middle=(low+high)>>1;
      if (points[middle].distance<=distance) low=middle;
      else high=middle;
    }
    const a=points[low],b=points[high];
    const fraction=(distance-a.distance)/(b.distance-a.distance);
    return a.time+(b.time-a.time)*fraction;
  }
}
