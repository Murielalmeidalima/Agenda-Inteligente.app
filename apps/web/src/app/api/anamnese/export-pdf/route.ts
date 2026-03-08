import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    // We use the service role key to have access to the full response and signatures
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const body = await req.json();
    const { responseId } = body;
    
    if (!responseId) {
      return NextResponse.json({ error: 'ID da anamnese é obrigatório' }, { status: 400 });
    }
    
    // 1. Fetch Response Data
    const { data: response, error: responseError } = await supabase
      .from('anamnese_responses')
      .select(`
        *,
        clients (
          id,
          name,
          cpf,
          email,
          phone
        ),
        anamnese_templates (
          id,
          title
        )
      `)
      .eq('id', responseId)
      .single();
      
    if (responseError || !response) {
      console.error('Error fetching anamnese response:', responseError);
      return NextResponse.json({ error: 'Anamnese não encontrada' }, { status: 404 });
    }
    
    const responsesMap = response.responses as Record<string, any>;
    const questionsList = response.questions || []; // Assuming questions might be saved in responses if not normalized
    
    // 2. Create PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    let y = height - 50;
    
    const drawText = (text: string, options: any) => {
      // Very basic text wrap handling
      if (y < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - 50;
      }
      page.drawText(text, options);
      y -= (options.size || 12) + 6;
    };
    
    // Title
    drawText(`Ficha de Anamnese: ${response.anamnese_templates?.title || 'Avaliação'}`, { font: fontBold, size: 16 });
    y -= 10;
    
    // Patient Info
    drawText(`Paciente: ${response.clients?.name || 'N/A'}`, { font: fontBold, size: 12 });
    drawText(`CPF: ${response.clients?.cpf || 'N/A'} | Contato: ${response.clients?.phone || 'N/A'}`, { font, size: 10 });
    drawText(`Data de Preenchimento: ${new Date(response.created_at).toLocaleDateString('pt-BR')}`, { font, size: 10 });
    y -= 20;
    
    // Responses
    drawText('RESPOSTAS', { font: fontBold, size: 14 });
    y -= 10;
    
    Object.entries(responsesMap).forEach(([questionTitle, answer]) => {
      drawText(`${questionTitle}:`, { font: fontBold, size: 11 });
      const answerText = Array.isArray(answer) ? answer.join(', ') : String(answer);
      drawText(answerText, { font, size: 11 });
      y -= 5;
    });
    
    y -= 20;
    
    // LGPD & Signature
    if (response.consent_accepted) {
      drawText('TERMO DE CONSENTIMENTO (LGPD)', { font: fontBold, size: 14 });
      y -= 10;
      
      const consentText = response.consent_text || 'Declaro que todas as informações são verdadeiras.';
      // Simple text wrapping for consent
      const words = consentText.split(' ');
      let line = '';
      words.forEach((word: string) => {
        if (line.length + word.length > 80) {
          drawText(line, { font, size: 10 });
          line = '';
        }
        line += word + ' ';
      });
      if (line) drawText(line, { font, size: 10 });
      y -= 10;
      
      const ip = response.consent_ip || 'N/A';
      const timestamp = response.consent_timestamp ? new Date(response.consent_timestamp).toLocaleString('pt-BR') : 'N/A';
      drawText(`Aceito eletronicamente em: ${timestamp} | IP: ${ip}`, { font, size: 10 });
      
      // Hash
      if (response.signature_hash) {
        drawText(`Hash de Integridade: ${response.signature_hash}`, { font, size: 8 });
      }
    }
    
    // Add Signature Image if exists
    if (response.signature_image_url) {
       // Typically signature_image_url is a Supabase Storage URL
       try {
         // Attempt to fetch image buffer
         const imgRes = await fetch(response.signature_image_url);
         if (imgRes.ok) {
           const imageBytes = await imgRes.arrayBuffer();
           // Try parsing as PNG or JPG
           let pdfImage;
           try {
              pdfImage = await pdfDoc.embedPng(imageBytes);
           } catch (e) {
              pdfImage = await pdfDoc.embedJpg(imageBytes);
           }
           
           if (pdfImage) {
              const imgDims = pdfImage.scaleToFit(200, 100);
              if (y - imgDims.height < 50) {
                 page = pdfDoc.addPage([595.28, 841.89]);
                 y = height - 50;
              }
              page.drawImage(pdfImage, {
                 x: 50,
                 y: y - imgDims.height,
                 width: imgDims.width,
                 height: imgDims.height,
              });
              y -= (imgDims.height + 20);
           }
         }
       } catch (err) {
         console.error('Error attaching signature image', err);
       }
    }
    
    const pdfBytes = await pdfDoc.save();
    
    // 3. Save to Supabase Storage
    const fileName = `anamnese_${response.clients?.id || 'client'}_${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('anamnese_documents')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });
      
    if (uploadError) {
      console.error('Upload Error:', uploadError);
      return NextResponse.json({ error: 'Erro ao salvar o PDF.' }, { status: 500 });
    }
    
    const { data: publicUrlData } = supabase
      .storage
      .from('anamnese_documents')
      .getPublicUrl(fileName); // Public URL since we might want users to easily download it, or handle signed URLs. The prompt states to download it.
      
    const fileUrl = publicUrlData.publicUrl;
    
    // Update response with URL
    await supabase
      .from('anamnese_responses')
      .update({ pdf_url: fileUrl })
      .eq('id', responseId);
      
    return NextResponse.json({ success: true, url: fileUrl });
    
  } catch (err: any) {
    console.error('PDF Export Error:', err);
    return NextResponse.json({ error: 'Erro interno no servidor', details: err.message }, { status: 500 });
  }
}
