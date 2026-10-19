import { useState } from "react";
import * as Linking from "expo-linking";
import { useRemote, type ApiSimulation } from "../src/data";
import { environment } from "../src/config";
import {
  Button,
  Card,
  Copy,
  Loading,
  Navigation,
  Notice,
  Screen,
  YearPicker,
} from "../src/ui";
export default function Simulations() {
  const [year, setYear] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const result = useRemote<ApiSimulation[]>(
    `/simulations/available${year === null ? "" : `?schoolYear=${year}`}`,
  );
  return (
    <Screen
      title="Hora de um simulado"
      subtitle="Escolha sua avaliação. Nesta prova, a realização continua na web."
      student
    >
      
      <YearPicker year={year} onChange={setYear} />
      {result.loading && <Loading />}
      {result.error && (
        <Notice>
          {result.error}
          <Button title="Atualizar" onPress={result.reload} />
        </Notice>
      )}
      {message && <Notice>{message}</Notice>}
      {result.data?.length === 0 && (
        <Copy>Nenhum simulado disponível para esta faixa.</Copy>
      )}
      {result.data?.map((simulation) => (
        <Card key={simulation.id} title={simulation.title}>
          <Copy muted>
            {simulation.discipline.name} · {simulation.totalQuestions} questões
          </Copy>
          {simulation.subtitle && <Copy>{simulation.subtitle}</Copy>}
          <Button
            title="Continuar na web"
            secondary
            onPress={() => {
              void Linking.openURL(
                `${environment.webOrigin}/simulado/${encodeURIComponent(simulation.id)}`,
              ).catch(() => setMessage("Não foi possível abrir o navegador."));
            }}
          />
        </Card>
      ))}
    </Screen>
  );
}
