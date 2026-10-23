$target = @"
<div class="text-center mt-2" style="padding: 1cqh 2cqw; width: 100%; border-bottom: 2px solid rgba(76, 175, 80, 0.5);">

        </div>
    </div>
</section>
"@

$replacement = @"
<div class="text-center mt-2" style="padding: 1cqh 2cqw; width: 100%; border-bottom: 2px solid rgba(76, 175, 80, 0.5);">
<span class="font-sansation font-bold text-white" style="font-size: 1.5cqw;">4 Seniores = OPEX <span style="color: #4CAF50;">-20%</span></span>
</div>
<!-- Main Delivery Maintenance Box -->
<div class="anim-pop-late text-center relative" style="width: 90%; border: 2px solid #4CAF50; padding: 1.5cqh; border-radius: 8px; background: rgba(76, 175, 80, 0.1); box-shadow: 0 0 15px rgba(76, 175, 80, 0.2); animation-delay: 1.4s; margin-top: 1cqh;">
<h4 class="font-sansation font-bold text-white leading-tight" style="font-size: 1.5cqw;">
Capacidade de Entrega<br/>Técnica Mantida
</h4>
</div>
</div>
</div>
</div>
</section>
"@

$content = Get-Content index.html -Raw
$content = $content.Replace($target, $replacement)
$content = $content.Replace($target.Replace("`r`n", "`n"), $replacement)
Set-Content index.html -Value $content
