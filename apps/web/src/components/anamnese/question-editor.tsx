'use client';

// MOCK simples para a interface - Componente REAIS usariam DragDropContext
// Esta é uma versão funcional simplificada para acelerar o desenvolvimento
import { useState } from 'react';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label, Switch, Card } from '@projeto/ui';
import { Trash2, GripVertical, Plus } from 'lucide-react';

export default function QuestionEditor({ questions, onChange }: any) {
  
  function addQuestion() {
    onChange([
      ...questions,
      { 
        id: crypto.randomUUID(), 
        question_text: '', 
        type: 'text_short', 
        is_required: false,
        order: questions.length + 1
      }
    ]);
  }

  function updateQuestion(index: number, field: string, value: any) {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    onChange(newQuestions);
  }

  function removeQuestion(index: number) {
    const newQuestions = questions.filter((_: any, i: number) => i !== index);
    onChange(newQuestions);
  }

  return (
    <div className="space-y-4">
       {questions.map((q: any, i: number) => (
          <Card key={q.id} className="p-4 bg-white border-[#E5E0D8] rounded-2xl flex gap-4 items-start">
             <div className="mt-3 text-[#8A847C] cursor-move">
                <GripVertical className="h-5 w-5" />
             </div>
             
             <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="md:col-span-2 space-y-2">
                      <Label className="text-xs font-bold text-[#5C5855] uppercase">Pergunta</Label>
                      <Input 
                        value={q.question_text}
                        onChange={(e) => updateQuestion(i, 'question_text', e.target.value)}
                        className="bg-[#FAF9F6] border-[#E5E0D8] text-[#2C2825] rounded-xl"
                        placeholder="Ex: Possui alergia?"
                      />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs font-bold text-[#5C5855] uppercase">Tipo</Label>
                      <Select value={q.type} onValueChange={(val) => updateQuestion(i, 'type', val)}>
                         <SelectTrigger className="bg-[#FAF9F6] border-[#E5E0D8] text-[#2C2825] rounded-xl">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="bg-[#FAF9F6] border-[#E5E0D8] text-[#2C2825]">
                            <SelectItem value="text_short">Texto Curto</SelectItem>
                            <SelectItem value="text_long">Texto Longo</SelectItem>
                            <SelectItem value="yes_no">Sim/Não</SelectItem>
                            <SelectItem value="date">Data</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                </div>

                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <Switch 
                        checked={q.is_required}
                        onCheckedChange={(checked) => updateQuestion(i, 'is_required', checked)}
                      />
                      <Label className="text-sm text-[#5C5855]">Obrigatória</Label>
                   </div>
                   
                   <Button 
                     variant="ghost" 
                     className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                     onClick={() => removeQuestion(i)}
                   >
                      <Trash2 className="h-4 w-4" />
                   </Button>
                </div>
             </div>
          </Card>
       ))}

       <Button 
         onClick={addQuestion}
         className="w-full h-12 border-2 border-dashed border-[#E5E0D8] bg-transparent text-[#5C5855] hover:border-primary-500 hover:text-primary-500 hover:bg-primary-500/5 rounded-2xl font-bold"
       >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Pergunta
       </Button>
    </div>
  );
}
